import { AIProvider, AIContext, AIDecisionOutput } from './AIProvider';
import { FAILURE_TYPE } from '../../config/constants';

/**
 * Mock AI Provider — deterministic, no API key required.
 * Uses rule-based scoring to simulate realistic AI decisions for demo/testing.
 * Clearly labeled as MOCK in all decision records.
 */
export class MockAIProvider extends AIProvider {
  readonly name = 'MockAIProvider';
  readonly version = 'v1.0';

  async analyzeForRecovery(context: AIContext): Promise<AIDecisionOutput> {
    // Simulate AI processing latency
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));

    const score = this.calculateRecoveryScore(context);
    const probability = Math.min(0.98, Math.max(0.05, score));
    const action = this.selectAction(context, probability);
    const requiresApproval =
      context.payment.amount > context.policy.requireApprovalAboveAmount;

    return {
      recoverable: probability >= context.policy.minimumRecoveryProbability,
      recoveryProbability: parseFloat(probability.toFixed(2)),
      riskLevel: this.getRiskLevel(probability),
      priority: this.getPriority(context.payment.amount, probability),
      recommendedAction: action,
      delayMinutes: this.getDelay(context.payment.failureType, action),
      maxAttempts: Math.min(context.policy.maxAttempts, 3),
      reason: this.buildReason(context, probability, action),
      decisionFactors: this.getDecisionFactors(context, probability),
      requiresHumanApproval: requiresApproval || probability < 0.6,
      stopConditions: ['payment_success', 'max_attempts_reached', 'customer_opted_out'],
      confidence: parseFloat((0.7 + Math.random() * 0.25).toFixed(2)),
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  private calculateRecoveryScore(ctx: AIContext): number {
    let score = 0.5; // base

    // Customer history is the strongest signal
    const successRate =
      ctx.customer.totalPayments > 0
        ? ctx.customer.successfulPayments / ctx.customer.totalPayments
        : 0.5;
    score += successRate * 0.3;

    // Recovery score from customer profile
    score += (ctx.customer.recoveryScore / 100) * 0.2;

    // Failure type recoverability
    const recoverableTypes: string[] = [
      FAILURE_TYPE.BANK_TIMEOUT,
      FAILURE_TYPE.UPI_TIMEOUT,
      FAILURE_TYPE.NETWORK_ERROR,
    ];
    const hardFailures: string[] = [
      FAILURE_TYPE.CARD_EXPIRED,
      FAILURE_TYPE.INSUFFICIENT_FUNDS,
      FAILURE_TYPE.BANK_DECLINED,
    ];

    if (recoverableTypes.includes(ctx.payment.failureType)) {
      score += 0.15;
    } else if (hardFailures.includes(ctx.payment.failureType)) {
      score -= 0.15;
    }

    // Penalize repeat attempts
    if (ctx.recoveryCase.attemptCount >= 2) score -= 0.2;
    if (ctx.recoveryCase.attemptCount >= 3) score -= 0.2;

    // Customer segment bonus
    if (ctx.customer.segment === 'LOYAL') score += 0.1;
    if (ctx.customer.segment === 'HIGH_VALUE') score += 0.05;
    if (ctx.customer.segment === 'NEW') score -= 0.05;

    return score;
  }

  private selectAction(ctx: AIContext, probability: number): AIDecisionOutput['recommendedAction'] {
    if (probability < ctx.policy.minimumRecoveryProbability) return 'STOP';
    if (ctx.recoveryCase.attemptCount >= ctx.policy.maxAttempts) return 'STOP';

    const timeouts: string[] = [FAILURE_TYPE.BANK_TIMEOUT, FAILURE_TYPE.UPI_TIMEOUT, FAILURE_TYPE.NETWORK_ERROR];
    const isTimeout = timeouts.includes(ctx.payment.failureType);

    if (isTimeout && ctx.recoveryCase.attemptCount === 0) return 'CREATE_PAYMENT_LINK';
    if (ctx.payment.failureType === FAILURE_TYPE.CARD_EXPIRED) return 'REQUEST_CUSTOMER_ACTION';
    if (probability > 0.8) return 'CREATE_PAYMENT_LINK';
    if (probability > 0.65) return 'SEND_REMINDER';
    if (ctx.payment.amount > 500000) return 'ESCALATE_TO_HUMAN'; // > ₹5,000
    return 'SEND_REMINDER';
  }

  private getDelay(failureType: string, action: string): number {
    if (action === 'STOP') return 0;
    const quickFailures = ['BANK_TIMEOUT', 'UPI_TIMEOUT', 'NETWORK_ERROR'];
    return quickFailures.includes(failureType) ? 15 : 30;
  }

  private getRiskLevel(probability: number): AIDecisionOutput['riskLevel'] {
    if (probability >= 0.8) return 'LOW';
    if (probability >= 0.65) return 'MEDIUM';
    if (probability >= 0.45) return 'HIGH';
    return 'CRITICAL';
  }

  private getPriority(amount: number, probability: number): AIDecisionOutput['priority'] {
    // High amount + high probability = critical priority
    if (amount > 1000000 && probability > 0.7) return 'CRITICAL'; // > ₹10,000
    if (amount > 500000 || probability > 0.8) return 'HIGH'; // > ₹5,000
    if (amount > 100000) return 'MEDIUM'; // > ₹1,000
    return 'LOW';
  }

  private buildReason(ctx: AIContext, probability: number, action: string): string {
    const successRate =
      ctx.customer.totalPayments > 0
        ? Math.round((ctx.customer.successfulPayments / ctx.customer.totalPayments) * 100)
        : 50;

    const parts: string[] = [];

    if (successRate > 80) {
      parts.push(`Customer has a strong payment history (${successRate}% success rate).`);
    } else if (successRate > 60) {
      parts.push(`Customer has a moderate payment history (${successRate}% success rate).`);
    } else {
      parts.push(`Customer has a limited payment history (${successRate}% success rate).`);
    }

    const recoverableTypes = ['BANK_TIMEOUT', 'UPI_TIMEOUT', 'NETWORK_ERROR'];
    if (recoverableTypes.includes(ctx.payment.failureType)) {
      parts.push('The failure appears to be a temporary network or bank issue.');
    } else {
      parts.push(`Failure type (${ctx.payment.failureType}) may require customer action.`);
    }

    if (ctx.recoveryCase.attemptCount > 0) {
      parts.push(`This is attempt #${ctx.recoveryCase.attemptCount + 1}.`);
    }

    parts.push(
      `Recommended action: ${action.replace(/_/g, ' ')} with ${Math.round(probability * 100)}% estimated recovery probability.`
    );

    return parts.join(' ');
  }

  private getDecisionFactors(ctx: AIContext, probability: number): string[] {
    const factors: string[] = [];
    const successRate =
      ctx.customer.totalPayments > 0
        ? Math.round((ctx.customer.successfulPayments / ctx.customer.totalPayments) * 100)
        : 50;

    factors.push(
      `Customer payment success rate: ${successRate}% (${ctx.customer.successfulPayments}/${ctx.customer.totalPayments} payments)`
    );
    factors.push(`Failure type: ${ctx.payment.failureType} (${ctx.payment.failureReason || 'no detail'})`);
    factors.push(`Customer segment: ${ctx.customer.segment}`);
    factors.push(`Recovery score: ${ctx.customer.recoveryScore}/100`);
    factors.push(`Previous recovery attempts: ${ctx.recoveryCase.attemptCount}`);
    factors.push(`Estimated recovery probability: ${Math.round(probability * 100)}%`);

    return factors;
  }
}
