"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataGenerator = exports.DataGenerator = void 0;
const Payment_1 = require("../models/Payment");
const Customer_1 = require("../models/Customer");
const RecoveryCase_1 = require("../models/RecoveryCase");
const AiDecision_1 = require("../models/AiDecision");
const recovery_service_1 = require("../services/recovery.service");
const RecoveryAgent_1 = require("../ai/agents/RecoveryAgent");
const constants_1 = require("../config/constants");
const auditService_1 = require("../audit/auditService");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
const INDIAN_NAMES = [
    'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sunita Verma', 'Raj Gupta',
    'Neha Singh', 'Vikram Rao', 'Anjali Mehta', 'Suresh Nair', 'Kavitha Reddy',
    'Arjun Kapoor', 'Deepa Iyer', 'Rohan Joshi', 'Sneha Desai', 'Manish Shah',
    'Pooja Bhat', 'Kiran Malhotra', 'Ananya Roy', 'Sanjay Pillai', 'Ritu Agarwal',
];
const DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function weightedRandom(options) {
    const total = options.reduce((sum, o) => sum + o.weight, 0);
    let rand = Math.random() * total;
    for (const option of options) {
        rand -= option.weight;
        if (rand <= 0)
            return option.value;
    }
    return options[0].value;
}
class DataGenerator {
    async generateDataset(merchantId, params) {
        const { count, successRate = 0.82, averageOrderValue = 249900, // ₹2,499
        upiPercent = 0.45, cardPercent = 0.35, repeatCustomerRate = 0.6, } = params;
        logger_1.logger.info(`DataGenerator: Generating ${count} payments for merchant ${merchantId}`);
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
                const paymentData = {
                    merchantId,
                    customerId: customer._id,
                    razorpayPaymentId: `pay_sim_${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 14)}`,
                    razorpayOrderId: `order_sim_${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 14)}`,
                    amount,
                    currency: 'INR',
                    method,
                    isSimulated: true,
                    createdAt: new Date(Date.now() - randomInt(0, 7 * 24 * 60 * 60 * 1000)),
                };
                if (isSuccess) {
                    paymentData.status = constants_1.PAYMENT_STATUS.CAPTURED;
                    paymentData.capturedAt = paymentData.createdAt;
                    successCount++;
                }
                else {
                    const failureType = this.selectFailureType(method);
                    paymentData.status = constants_1.PAYMENT_STATUS.FAILED;
                    paymentData.failedAt = paymentData.createdAt;
                    paymentData.failureType = failureType;
                    paymentData.failureReason = this.getFailureReason(failureType);
                    paymentData.failureCode = `ERR_${failureType}`;
                    failedCount++;
                    totalAtRisk += amount;
                }
                paymentPromises.push(Payment_1.Payment.create(paymentData));
            }
            const payments = await Promise.all(paymentPromises);
            // Update customer stats
            for (const payment of payments) {
                if (payment.status === constants_1.PAYMENT_STATUS.CAPTURED) {
                    await Customer_1.Customer.findByIdAndUpdate(payment.customerId, {
                        $inc: { totalPayments: 1, successfulPayments: 1, totalRevenue: payment.amount },
                        lastPaymentAt: payment.capturedAt,
                    });
                }
                else {
                    await Customer_1.Customer.findByIdAndUpdate(payment.customerId, {
                        $inc: { totalPayments: 1, failedPayments: 1 },
                    });
                }
            }
            // Process failed payments — create recovery cases and run AI
            const failedPayments = payments.filter((p) => p.status === constants_1.PAYMENT_STATUS.FAILED);
            for (const payment of failedPayments) {
                try {
                    const caseId = await recovery_service_1.recoveryService.createRecoveryCase(payment._id.toString(), merchantId);
                    recoveryCasesCreated++;
                    // Run AI analysis synchronously in simulation (no queue)
                    const result = await RecoveryAgent_1.recoveryAgent.analyze(caseId);
                    aiDecisionCount++;
                    analysisCompleted++;
                    if (result.policyResult.requiresHumanApproval) {
                        humanEscalations++;
                    }
                    else if (!result.policyResult.approved) {
                        blockedCount++;
                    }
                    else if (result.decision.recoverable) {
                        // Simulate recovery success based on probability
                        const willRecover = Math.random() < result.decision.recoveryProbability * 0.85;
                        if (willRecover) {
                            await RecoveryCase_1.RecoveryCase.findByIdAndUpdate(caseId, {
                                status: constants_1.RECOVERY_CASE_STATUS.RECOVERED,
                                recoveredAmount: payment.amount,
                            });
                            recoveredCount++;
                            recoveredAmount += payment.amount;
                        }
                        else {
                            await RecoveryCase_1.RecoveryCase.findByIdAndUpdate(caseId, {
                                status: constants_1.RECOVERY_CASE_STATUS.IN_RECOVERY,
                            });
                        }
                    }
                }
                catch (error) {
                    logger_1.logger.error('Simulation: Error processing failed payment', error);
                }
            }
        }
        const result = {
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
        logger_1.logger.info('DataGenerator: Simulation complete', result);
        return result;
    }
    /**
     * The "Winning Demo" scenario — Rahul Sharma's ₹4,999 payment
     */
    async runWinningDemo(merchantId) {
        // Create Rahul Sharma — loyal customer, 8/9 success rate
        let customer = await Customer_1.Customer.findOne({ merchantId, name: 'Rahul Sharma' });
        if (!customer) {
            customer = await Customer_1.Customer.create({
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
                customerSegment: constants_1.CUSTOMER_SEGMENT.LOYAL,
                isSimulated: true,
            });
        }
        // Create the failed payment — ₹4,999 UPI timeout
        const payment = await Payment_1.Payment.create({
            merchantId,
            customerId: customer._id,
            razorpayPaymentId: `pay_demo_${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 14)}`,
            razorpayOrderId: `order_demo_${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 14)}`,
            amount: 499900, // ₹4,999
            currency: 'INR',
            status: constants_1.PAYMENT_STATUS.FAILED,
            method: 'upi',
            failureType: constants_1.FAILURE_TYPE.UPI_TIMEOUT,
            failureReason: 'Transaction timed out. UPI server did not respond.',
            failureCode: 'BAD_REQUEST_ERROR',
            failedAt: new Date(),
            isSimulated: true,
        });
        // Audit: Payment failed
        await auditService_1.auditService.log({
            merchantId,
            actorType: constants_1.ACTOR_TYPE.RAZORPAY,
            action: 'payment.failed',
            entityType: 'Payment',
            entityId: payment._id.toString(),
            metadata: { amount: 499900, method: 'upi', failureType: constants_1.FAILURE_TYPE.UPI_TIMEOUT },
        });
        // Create recovery case
        const caseId = await recovery_service_1.recoveryService.createRecoveryCase(payment._id.toString(), merchantId);
        // Audit: Recovery case created
        await auditService_1.auditService.log({
            merchantId,
            actorType: constants_1.ACTOR_TYPE.SYSTEM,
            action: 'RECOVERY_CASE_CREATED',
            entityType: 'RecoveryCase',
            entityId: caseId,
        });
        // Run AI analysis
        const { decision, policyResult, aiDecisionId } = await RecoveryAgent_1.recoveryAgent.analyze(caseId);
        // Simulate executing the action
        const actionResult = await recovery_service_1.recoveryService.executeAction(caseId, decision.recommendedAction, 0);
        // Simulate payment success (webhook)
        await RecoveryCase_1.RecoveryCase.findByIdAndUpdate(caseId, {
            status: constants_1.RECOVERY_CASE_STATUS.RECOVERED,
            recoveredAmount: 499900,
            currentStage: 'PAYMENT_RECOVERED',
        });
        // Audit: Payment recovered
        await auditService_1.auditService.log({
            merchantId,
            actorType: constants_1.ACTOR_TYPE.RAZORPAY,
            action: 'payment_link.paid',
            entityType: 'RecoveryCase',
            entityId: caseId,
            after: { recoveredAmount: 499900 },
        });
        const finalCase = await RecoveryCase_1.RecoveryCase.findById(caseId).lean();
        const aiDecisionDoc = await AiDecision_1.AiDecision.findById(aiDecisionId).lean();
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
    async getOrCreateCustomers(merchantId, count, repeatRate) {
        const existing = await Customer_1.Customer.find({ merchantId }).limit(count).lean();
        if (existing.length >= count)
            return existing;
        const toCreate = count - existing.length;
        const newCustomers = [];
        for (let i = 0; i < toCreate; i++) {
            const name = randomFrom(INDIAN_NAMES);
            const segment = randomFrom([
                constants_1.CUSTOMER_SEGMENT.LOYAL,
                constants_1.CUSTOMER_SEGMENT.REGULAR,
                constants_1.CUSTOMER_SEGMENT.NEW,
                constants_1.CUSTOMER_SEGMENT.HIGH_VALUE,
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
        const created = await Customer_1.Customer.insertMany(newCustomers);
        return [...existing, ...created];
    }
    generateAmount(average) {
        // Log-normal distribution around average
        const variance = average * 0.5;
        const amount = average + (Math.random() - 0.5) * variance * 2;
        // Round to nearest ₹1 (100 paise)
        return Math.max(10000, Math.round(amount / 100) * 100);
    }
    selectFailureType(method) {
        if (method === 'upi') {
            return weightedRandom([
                { value: constants_1.FAILURE_TYPE.UPI_TIMEOUT, weight: 35 },
                { value: constants_1.FAILURE_TYPE.UPI_DECLINED, weight: 25 },
                { value: constants_1.FAILURE_TYPE.BANK_TIMEOUT, weight: 20 },
                { value: constants_1.FAILURE_TYPE.INSUFFICIENT_FUNDS, weight: 15 },
                { value: constants_1.FAILURE_TYPE.CUSTOMER_ABANDONED, weight: 5 },
            ]);
        }
        if (method === 'card') {
            return weightedRandom([
                { value: constants_1.FAILURE_TYPE.BANK_DECLINED, weight: 30 },
                { value: constants_1.FAILURE_TYPE.CARD_DECLINED, weight: 25 },
                { value: constants_1.FAILURE_TYPE.CARD_EXPIRED, weight: 20 },
                { value: constants_1.FAILURE_TYPE.INSUFFICIENT_FUNDS, weight: 15 },
                { value: constants_1.FAILURE_TYPE.BANK_TIMEOUT, weight: 10 },
            ]);
        }
        return weightedRandom([
            { value: constants_1.FAILURE_TYPE.BANK_TIMEOUT, weight: 40 },
            { value: constants_1.FAILURE_TYPE.BANK_DECLINED, weight: 30 },
            { value: constants_1.FAILURE_TYPE.NETWORK_ERROR, weight: 20 },
            { value: constants_1.FAILURE_TYPE.CUSTOMER_ABANDONED, weight: 10 },
        ]);
    }
    getFailureReason(failureType) {
        const reasons = {
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
exports.DataGenerator = DataGenerator;
exports.dataGenerator = new DataGenerator();
//# sourceMappingURL=dataGenerator.js.map