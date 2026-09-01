import { Types } from 'mongoose';
import { Payment } from '../models/Payment';
import { Customer } from '../models/Customer';
import { RecoveryCase } from '../models/RecoveryCase';
import { RecoveryAttempt } from '../models/RecoveryAttempt';
import { AiDecision } from '../models/AiDecision';
import { recoveryService } from '../services/recovery.service';
import { recoveryAgent } from '../ai/agents/RecoveryAgent';
import {
  FAILURE_TYPE,
  CUSTOMER_SEGMENT,
  PAYMENT_STATUS,
  RECOVERY_CASE_STATUS,
  RECOVERY_ACTION,
  ACTOR_TYPE,
  RISK_LEVEL,
  PRIORITY,
} from '../config/constants';
import { auditService } from '../audit/auditService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface SimulationParams {
  count: number;
  successRate?: number; // 0-1
  averageOrderValue?: number; // in paise
  upiPercent?: number; // 0-1
  cardPercent?: number; // 0-1
  subscriptionPercent?: number; // 0-1
  repeatCustomerRate?: number; // 0-1
}

export interface SimulationResult {
  totalGenerated: number;
  successfulPayments: number;
  failedPayments: number;
  recoveryCasesCreated: number;
  analysisCompleted: number;
  recovered: number;
  recoveredAmount: number;
  totalAtRisk: number;
  aiDecisions: number;
  humanEscalations: number;
  blockedByPolicy: number;
  isSimulated: true;
  label: 'SIMULATED DATA';
}

const INDIAN_NAMES = [
  'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sunita Verma', 'Raj Gupta',
  'Neha Singh', 'Vikram Rao', 'Anjali Mehta', 'Suresh Nair', 'Kavitha Reddy',
  'Arjun Kapoor', 'Deepa Iyer', 'Rohan Joshi', 'Sneha Desai', 'Manish Shah',
  'Pooja Bhat', 'Kiran Malhotra', 'Ananya Roy', 'Sanjay Pillai', 'Ritu Agarwal',
];

const DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedRandom(options: { value: string; weight: number }[]): string {
  const total = options.reduce((sum, o) => sum + o.weight, 0);
  let rand = Math.random() * total;
  for (const option of options) {
    rand -= option.weight;
    if (rand <= 0) return option.value;
  }
  return options[0].value;
}

export class DataGenerator {
  async generateDataset(
    merchantId: string,
    params: SimulationParams
  ): Promise<SimulationResult> {
    const {
      count,
      successRate = 0.82,
      averageOrderValue = 249900, // ₹2,499
      upiPercent = 0.45,
      cardPercent = 0.35,
      repeatCustomerRate = 0.6,
    } = params;

    logger.info(`DataGenerator: Generating ${count} payments for merchant ${merchantId}`);

    // Create customer pool
    const customerPool = await this.getOrCreateCustomers(merchantId, Math.ceil(count * 0.3), repeatCustomerRate);

    let successCount = 0;
    let failedCount = 0;
    let recoveryCasesCreated = 0;
    let analysisCompleted = 0;
    let recoveredCount = 0;
    let recoveredAmount = 0;
    let totalAtRisk = 0;
    let aiDecisionCount = 0;
    let humanEscalations = 0;
    let blockedCount = 0;

    const batchSize = 50;
    const batches = Math.ceil(count / batchSize);

    for (let b = 0; b < batches; b++) {
      const batchCount = Math.min(batchSize, count - b * batchSize);
      const paymentPromises = [];

      for (let i = 0; i < batchCount; i++) {
        const customer = randomFrom(customerPool);
        const isSuccess = Math.random() < successRate;
        const amount = this.generateAmount(averageOrderValue);
        const method = weightedRandom([
          { value: 'upi', weight: upiPercent * 100 },
          { value: 'card', weight: cardPercent * 100 },
          { value: 'netbanking', weight: (1 - upiPercent - cardPercent) * 100 },
        ]);

        const paymentData: any = {
          merchantId,
          customerId: customer._id,
          razorpayPaymentId: `pay_sim_${uuidv4().replace(/-/g, '').slice(0, 14)}`,
          razorpayOrderId: `order_sim_${uuidv4().replace(/-/g, '').slice(0, 14)}`,
          amount,
          currency: 'INR',
          method,
          isSimulated: true,
          createdAt: new Date(Date.now() - randomInt(0, 7 * 24 * 60 * 60 * 1000)),
        };

        if (isSuccess) {
          paymentData.status = PAYMENT_STATUS.CAPTURED;
          paymentData.capturedAt = paymentData.createdAt;
          successCount++;
        } else {
          const failureType = this.selectFailureType(method);
          paymentData.status = PAYMENT_STATUS.FAILED;
          paymentData.failedAt = paymentData.createdAt;
          paymentData.failureType = failureType;
          paymentData.failureReason = this.getFailureReason(failureType);
          paymentData.failureCode = `ERR_${failureType}`;
          failedCount++;
          totalAtRisk += amount;
        }

        paymentPromises.push(Payment.create(paymentData));
      }

      const payments = await Promise.all(paymentPromises);

      // Update customer stats
      for (const payment of payments) {
        if (payment.status === PAYMENT_STATUS.CAPTURED) {
          await Customer.findByIdAndUpdate(payment.customerId, {
            $inc: { totalPayments: 1, successfulPayments: 1, totalRevenue: payment.amount },
            lastPaymentAt: payment.capturedAt,
          });
        } else {
          await Customer.findByIdAndUpdate(payment.customerId, {
            $inc: { totalPayments: 1, failedPayments: 1 },
          });
        }
      }

      // Process failed payments — create recovery cases and run AI
      const failedPayments = payments.filter((p) => p.status === PAYMENT_STATUS.FAILED);

      for (const payment of failedPayments) {
        try {
          const caseId = await recoveryService.createRecoveryCase(
            (payment._id as Types.ObjectId).toString(),
            merchantId
          );
          recoveryCasesCreated++;

          // Run AI analysis synchronously in simulation (no queue)
          const result = await recoveryAgent.analyze(caseId);
          aiDecisionCount++;
          analysisCompleted++;

          if (result.policyResult.requiresHumanApproval) {
            humanEscalations++;
          } else if (!result.policyResult.approved) {
            blockedCount++;
          } else if (result.decision.recoverable) {
            // Simulate recovery success based on probability
            const willRecover = Math.random() < result.decision.recoveryProbability * 0.85;
            if (willRecover) {
              const recoveryTimeMinutes = randomInt(15, 180); // 15 min to 3 hours
              const recoveredAt = new Date(Date.now() + recoveryTimeMinutes * 60 * 1000);
              
              // Assign to A/B experiment variant randomly
              const experimentVariant = Math.random() > 0.5 ? 'Strategy A: Instant Payment Link' : 'Strategy B: Email Reminder';
              
              await RecoveryCase.findByIdAndUpdate(caseId, {
                status: RECOVERY_CASE_STATUS.RECOVERED,
                recoveredAmount: payment.amount,
                recoveredAt,
                experimentVariant,
              });
              recoveredCount++;
              recoveredAmount += payment.amount;
            } else {
              const experimentVariant = Math.random() > 0.5 ? 'Strategy A: Instant Payment Link' : 'Strategy B: Email Reminder';
              await RecoveryCase.findByIdAndUpdate(caseId, {
                status: RECOVERY_CASE_STATUS.IN_RECOVERY,
                experimentVariant,
              });
            }
          }
        } catch (error) {
          logger.error('Simulation: Error processing failed payment', error);
        }
      }
    }

    const result: SimulationResult = {
      totalGenerated: count,
      successfulPayments: successCount,
      failedPayments: failedCount,
      recoveryCasesCreated,
      analysisCompleted,
      recovered: recoveredCount,
      recoveredAmount,
      totalAtRisk,
      aiDecisions: aiDecisionCount,
      humanEscalations,
      blockedByPolicy: blockedCount,
      isSimulated: true,
      label: 'SIMULATED DATA',
    };

    logger.info('DataGenerator: Simulation complete', result);
    return result;
  }

  /**
   * The "Winning Demo" scenario — Rahul Sharma's ₹4,999 payment
   */
  async runWinningDemo(merchantId: string): Promise<{
    customer: any;
    payment: any;
    recoveryCase: any;
    aiDecision: any;
    paymentLink: any;
    result: string;
    isSimulated: true;
  }> {
    // Create Rahul Sharma — loyal customer, 8/9 success rate
    let customer = await Customer.findOne({ merchantId, name: 'Rahul Sharma' });
    if (!customer) {
      customer = await Customer.create({
        merchantId,
        name: 'Rahul Sharma',
        email: 'rahul.sharma@gmail.com',
        phone: '+919876543210',
        totalPayments: 9,
        successfulPayments: 8,
        failedPayments: 1,
        totalRevenue: 8 * 499900, // 8 × ₹4,999
        averageOrderValue: 499900,
        recoveryScore: 88,
        customerSegment: CUSTOMER_SEGMENT.LOYAL,
        isSimulated: true,
      } as any);
    }

    // Create the failed payment — ₹4,999 UPI timeout
    const payment = await Payment.create({
      merchantId,
      customerId: customer._id,
      razorpayPaymentId: `pay_demo_${uuidv4().replace(/-/g, '').slice(0, 14)}`,
      razorpayOrderId: `order_demo_${uuidv4().replace(/-/g, '').slice(0, 14)}`,
      amount: 499900, // ₹4,999
      currency: 'INR',
      status: PAYMENT_STATUS.FAILED,
      method: 'upi',
      failureType: FAILURE_TYPE.UPI_TIMEOUT,
      failureReason: 'Transaction timed out. UPI server did not respond.',
      failureCode: 'BAD_REQUEST_ERROR',
      failedAt: new Date(),
      isSimulated: true,
    });

    // Audit: Payment failed
    await auditService.log({
      merchantId,
      actorType: ACTOR_TYPE.RAZORPAY,
      action: 'payment.failed',
      entityType: 'Payment',
      entityId: (payment._id as Types.ObjectId).toString(),
      metadata: { amount: 499900, method: 'upi', failureType: FAILURE_TYPE.UPI_TIMEOUT },
    });

    // Create recovery case
    const caseId = await recoveryService.createRecoveryCase(
      (payment._id as Types.ObjectId).toString(),
      merchantId
    );

    // Audit: Recovery case created
    await auditService.log({
      merchantId,
      actorType: ACTOR_TYPE.SYSTEM,
      action: 'RECOVERY_CASE_CREATED',
      entityType: 'RecoveryCase',
      entityId: caseId,
    });

    // Run AI analysis
    const { decision, policyResult, aiDecisionId } = await recoveryAgent.analyze(caseId);

    // Simulate executing the action
    const actionResult = await recoveryService.executeAction(
      caseId,
      decision.recommendedAction,
      0
    );

    // Simulate payment success (webhook)
    const recoveredAt = new Date(Date.now() + 24 * 60 * 1000); // 24 minutes later
    await RecoveryCase.findByIdAndUpdate(caseId, {
      status: RECOVERY_CASE_STATUS.RECOVERED,
      recoveredAmount: 499900,
      recoveredAt,
      experimentVariant: 'Strategy A: Instant Payment Link',
      currentStage: 'PAYMENT_RECOVERED',
    });

    // Audit: Payment recovered
    await auditService.log({
      merchantId,
      actorType: ACTOR_TYPE.RAZORPAY,
      action: 'payment_link.paid',
      entityType: 'RecoveryCase',
      entityId: caseId,
      after: { recoveredAmount: 499900 },
    });

    const finalCase = await RecoveryCase.findById(caseId).lean();
    const aiDecisionDoc = await AiDecision.findById(aiDecisionId).lean();

    return {
      customer: { name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com', segment: 'LOYAL', recoveryScore: 88 },
      payment: { amount: 499900, method: 'upi', failureType: 'UPI_TIMEOUT', isSimulated: true },
      recoveryCase: finalCase,
      aiDecision: {
        probability: decision.recoveryProbability,
        action: decision.recommendedAction,
        reason: decision.reason,
        factors: decision.decisionFactors,
        policyApproved: policyResult.approved,
      },
      paymentLink: actionResult.result,
      result: '₹4,999 RECOVERED',
      isSimulated: true,
    };
  }

  private async getOrCreateCustomers(
    merchantId: string,
    count: number,
    repeatRate: number
  ): Promise<any[]> {
    const existing = await Customer.find({ merchantId }).limit(count).lean();
    if (existing.length >= count) return existing;

    const toCreate = count - existing.length;
    const newCustomers = [];

    for (let i = 0; i < toCreate; i++) {
      const name = randomFrom(INDIAN_NAMES);
      const segment = randomFrom([
        CUSTOMER_SEGMENT.LOYAL,
        CUSTOMER_SEGMENT.REGULAR,
        CUSTOMER_SEGMENT.NEW,
        CUSTOMER_SEGMENT.HIGH_VALUE,
      ]);
      const totalPmts = randomInt(1, 20);
      const successRate = segment === 'LOYAL' ? 0.88 : segment === 'HIGH_VALUE' ? 0.85 : 0.65;
      const successPmts = Math.floor(totalPmts * successRate);

      newCustomers.push({
        merchantId,
        name,
        email: `${name.toLowerCase().replace(/ /g, '.')}${randomInt(1, 999)}@${randomFrom(DOMAINS)}`,
        phone: `+91${randomInt(7000000000, 9999999999)}`,
        totalPayments: totalPmts,
        successfulPayments: successPmts,
        failedPayments: totalPmts - successPmts,
        totalRevenue: successPmts * randomInt(99900, 999900),
        averageOrderValue: randomInt(99900, 999900),
        recoveryScore: segment === 'LOYAL' ? randomInt(75, 95) : segment === 'NEW' ? randomInt(40, 65) : randomInt(60, 85),
        customerSegment: segment,
        isSimulated: true,
      });
    }

    const created = await Customer.insertMany(newCustomers);
    return [...existing, ...created];
  }

  private generateAmount(average: number): number {
    // Log-normal distribution around average
    const variance = average * 0.5;
    const amount = average + (Math.random() - 0.5) * variance * 2;
    // Round to nearest ₹1 (100 paise)
    return Math.max(10000, Math.round(amount / 100) * 100);
  }

  private selectFailureType(method: string): string {
    if (method === 'upi') {
      return weightedRandom([
        { value: FAILURE_TYPE.UPI_TIMEOUT, weight: 35 },
        { value: FAILURE_TYPE.UPI_DECLINED, weight: 25 },
        { value: FAILURE_TYPE.BANK_TIMEOUT, weight: 20 },
        { value: FAILURE_TYPE.INSUFFICIENT_FUNDS, weight: 15 },
        { value: FAILURE_TYPE.CUSTOMER_ABANDONED, weight: 5 },
      ]);
    }
    if (method === 'card') {
      return weightedRandom([
        { value: FAILURE_TYPE.BANK_DECLINED, weight: 30 },
        { value: FAILURE_TYPE.CARD_DECLINED, weight: 25 },
        { value: FAILURE_TYPE.CARD_EXPIRED, weight: 20 },
        { value: FAILURE_TYPE.INSUFFICIENT_FUNDS, weight: 15 },
        { value: FAILURE_TYPE.BANK_TIMEOUT, weight: 10 },
      ]);
    }
    return weightedRandom([
      { value: FAILURE_TYPE.BANK_TIMEOUT, weight: 40 },
      { value: FAILURE_TYPE.BANK_DECLINED, weight: 30 },
      { value: FAILURE_TYPE.NETWORK_ERROR, weight: 20 },
      { value: FAILURE_TYPE.CUSTOMER_ABANDONED, weight: 10 },
    ]);
  }

  private getFailureReason(failureType: string): string {
    const reasons: Record<string, string> = {
      INSUFFICIENT_FUNDS: 'Your account does not have sufficient funds.',
      BANK_TIMEOUT: 'Bank server did not respond within the expected time.',
      BANK_DECLINED: 'Transaction declined by your bank.',
      CARD_EXPIRED: 'Your card has expired.',
      CARD_DECLINED: 'Transaction declined by card issuer.',
      UPI_TIMEOUT: 'Transaction timed out. UPI server did not respond.',
      UPI_DECLINED: 'UPI transaction declined.',
      CUSTOMER_ABANDONED: 'Customer abandoned the payment.',
      NETWORK_ERROR: 'Network error occurred during payment.',
      MANDATE_FAILURE: 'Mandate registration failed.',
      UNKNOWN: 'Payment failed due to an unknown reason.',
    };
    return reasons[failureType] || 'Payment failed.';
  }
}

export const dataGenerator = new DataGenerator();
