import { Types } from 'mongoose';
import { AIProvider, AIContext, AIDecisionOutput } from '../providers/AIProvider';
import { MockAIProvider } from '../providers/MockAIProvider';
import { OpenAIProvider } from '../providers/OpenAIProvider';
import { AiDecision } from '../../models/AiDecision';
import { RecoveryCase } from '../../models/RecoveryCase';
import { Payment } from '../../models/Payment';
import { Customer } from '../../models/Customer';
import { RecoveryPolicy } from '../../models/RecoveryPolicy';
import { policyEngine } from '../../policies/PolicyEngine';
import { auditService } from '../../audit/auditService';
import { ACTOR_TYPE, RECOVERY_CASE_STATUS, DEFAULT_POLICY } from '../../config/constants';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

/**
 * RecoveryAgent — Main AI orchestrator
 *
 * Workflow:
 * 1. Load context (payment, customer, policy)
 * 2. Call AI provider for decision
 * 3. Run through policy engine (deterministic guardrails)
 * 4. Store decision in DB
 * 5. Update recovery case
 * 6. Return result (execution happens in recovery service)
 */
export class RecoveryAgent {
  private provider: AIProvider;

  constructor() {
    this.provider = this.initProvider();
  }

  private initProvider(): AIProvider {
    if (env.AI_PROVIDER === 'openai' && env.AI_API_KEY) {
      return new OpenAIProvider();
    }
    // Default to mock for demo/no-key mode
    return new MockAIProvider();
  }

  async analyze(recoveryCaseId: string): Promise<{
    decision: AIDecisionOutput;
    policyResult: { approved: boolean; requiresHumanApproval: boolean; blockedReason?: string; action: string };
    aiDecisionId: string;
  }> {
    const startMs = Date.now();

    // Load recovery case with related data
    const recoveryCase = await RecoveryCase.findById(recoveryCaseId);
    if (!recoveryCase) throw new Error(`Recovery case not found: ${recoveryCaseId}`);

    const [payment, customer, policy] = await Promise.all([
      Payment.findById(recoveryCase.paymentId),
      recoveryCase.customerId ? Customer.findById(recoveryCase.customerId) : null,
      RecoveryPolicy.findOne({ merchantId: recoveryCase.merchantId }),
    ]);

    if (!payment) throw new Error(`Payment not found for case: ${recoveryCaseId}`);

    const effectivePolicy = policy || {
      ...DEFAULT_POLICY,
      requireApprovalAboveAmount: DEFAULT_POLICY.requireApprovalAboveAmount,
      allowedActions: [...DEFAULT_POLICY.allowedActions],
    };

    // Build AI context — minimal data, no sensitive fields
    const context: AIContext = {
      payment: {
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method || 'unknown',
        failureReason: payment.failureReason || 'Unknown failure',
        failureCode: payment.failureCode || '',
        failureType: payment.failureType || 'UNKNOWN',
      },
      customer: {
        segment: customer?.customerSegment || 'NEW',
        recoveryScore: customer?.recoveryScore || 50,
        totalPayments: customer?.totalPayments || 0,
        successfulPayments: customer?.successfulPayments || 0,
        failedPayments: customer?.failedPayments || 0,
        averageOrderValue: customer?.averageOrderValue || payment.amount,
      },
      recoveryCase: {
        attemptCount: recoveryCase.attemptCount,
        maxAttempts: recoveryCase.maxAttempts,
      },
      policy: {
        minimumRecoveryProbability: effectivePolicy.minimumRecoveryProbability,
        requireApprovalAboveAmount: effectivePolicy.requireApprovalAboveAmount,
        allowedActions: effectivePolicy.allowedActions as string[],
        maxAttempts: effectivePolicy.maxAttempts,
      },
    };

    // Update case to ANALYZING status
    await RecoveryCase.findByIdAndUpdate(recoveryCaseId, {
      status: RECOVERY_CASE_STATUS.ANALYZING,
      currentStage: 'AI_ANALYZING',
    });

    // Call AI provider
    let aiDecision: AIDecisionOutput;
    try {
      aiDecision = await this.provider.analyzeForRecovery(context);
    } catch (error) {
      logger.error('RecoveryAgent: AI provider failed, using fallback', error);
      // Fallback: use mock AI
      const fallback = new MockAIProvider();
      aiDecision = await fallback.analyzeForRecovery(context);
      aiDecision.reason = '[FALLBACK] ' + aiDecision.reason;
    }

    // Run policy engine — this is mandatory and cannot be bypassed
    const policyResult = policyEngine.evaluate(
      aiDecision,
      recoveryCase,
      customer,
      effectivePolicy as any,
      undefined
    );

    const latencyMs = Date.now() - startMs;

    // Store AI decision
    const aiDecisionDoc = await AiDecision.create({
      merchantId: recoveryCase.merchantId,
      recoveryCaseId: recoveryCase._id,
      model: this.provider.name + '/' + this.provider.version,
      promptVersion: 'recovery-v1.0',
      inputContext: {
        // Store minimal context, not raw customer PII
        paymentAmount: context.payment.amount,
        paymentMethod: context.payment.method,
        failureType: context.payment.failureType,
        customerSegment: context.customer.segment,
        attemptCount: context.recoveryCase.attemptCount,
      },
      decision: aiDecision,
      confidence: aiDecision.confidence,
      reasoning: aiDecision.reason,
      policyResult,
      latencyMs,
    });

    // Update recovery case with AI results
    const newStatus = aiDecision.recoverable
      ? policyResult.requiresHumanApproval
        ? RECOVERY_CASE_STATUS.ESCALATED
        : policyResult.approved
        ? RECOVERY_CASE_STATUS.RECOVERABLE
        : RECOVERY_CASE_STATUS.STOPPED
      : RECOVERY_CASE_STATUS.NOT_RECOVERABLE;

    await RecoveryCase.findByIdAndUpdate(recoveryCaseId, {
      status: newStatus,
      recoveryProbability: aiDecision.recoveryProbability,
      riskLevel: aiDecision.riskLevel,
      priority: aiDecision.priority,
      recommendedAction: aiDecision.recommendedAction,
      reasoning: aiDecision.reason,
      aiDecisionId: aiDecisionDoc._id,
      requiresHumanApproval: policyResult.requiresHumanApproval,
      maxAttempts: aiDecision.maxAttempts,
      stopConditions: aiDecision.stopConditions,
      currentStage: 'AI_ANALYZED',
    });

    // Audit log
    await auditService.log({
      merchantId: recoveryCase.merchantId,
      actorType: ACTOR_TYPE.AI,
      actorId: this.provider.name,
      action: 'AI_RECOVERY_ANALYSIS',
      entityType: 'RecoveryCase',
      entityId: recoveryCaseId,
      after: {
        probability: aiDecision.recoveryProbability,
        action: aiDecision.recommendedAction,
        policyApproved: policyResult.approved,
        latencyMs,
      },
    });

    logger.info('RecoveryAgent: Analysis complete', {
      recoveryCaseId,
      probability: aiDecision.recoveryProbability,
      action: aiDecision.recommendedAction,
      policyApproved: policyResult.approved,
      latencyMs,
    });

    return {
      decision: aiDecision,
      policyResult,
      aiDecisionId: (aiDecisionDoc._id as Types.ObjectId).toString(),
    };
  }
}

export const recoveryAgent = new RecoveryAgent();
