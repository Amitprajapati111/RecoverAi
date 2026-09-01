import { PolicyEngine } from '../../policies/PolicyEngine';

describe('PolicyEngine Unit Tests', () => {
  const policyEngine = new PolicyEngine();

  const mockPolicy: any = {
    maxAttempts: 3,
    maxAmountPerAction: 100000,
    minimumRecoveryProbability: 0.55,
    cooldownMinutes: 30,
    allowedActions: ['CREATE_PAYMENT_LINK', 'SEND_REMINDER', 'SCHEDULE_RETRY', 'ESCALATE_TO_HUMAN', 'STOP'],
    requireApprovalAboveAmount: 1000000, // ₹10,000 in paise
    stopAfterSuccessfulPayment: true,
    stopAfterMaxAttempts: true,
  };

  const baseDecision: any = {
    recoverable: true,
    recoveryProbability: 0.85,
    riskLevel: 'LOW',
    priority: 'HIGH',
    recommendedAction: 'CREATE_PAYMENT_LINK',
    delayMinutes: 15,
    maxAttempts: 3,
    reason: 'High recovery probability',
    decisionFactors: ['Loyal customer'],
    requiresHumanApproval: false,
    stopConditions: ['payment_success'],
    confidence: 0.88,
  };

  const baseRecoveryCase: any = {
    _id: 'case_123',
    amountAtRisk: 499900, // ₹4,999
    attemptCount: 0,
  };

  test('Approves safe low-risk payment link action', () => {
    const result = policyEngine.evaluate(baseDecision, baseRecoveryCase, null, mockPolicy);
    expect(result.approved).toBe(true);
    expect(result.requiresHumanApproval).toBe(false);
    expect(result.action).toBe('CREATE_PAYMENT_LINK' as const);
  });

  test('Blocks action when customer has opted out', () => {
    const customerOptOut: any = { optedOutOfRecovery: true };
    const result = policyEngine.evaluate(baseDecision, baseRecoveryCase, customerOptOut, mockPolicy);
    expect(result.approved).toBe(false);
    expect(result.action).toBe('STOP' as const);
    expect(result.blockedReason).toContain('opted out');
  });

  test('Blocks action when max attempts reached', () => {
    const maxAttemptCase: any = { ...baseRecoveryCase, attemptCount: 3 };
    const result = policyEngine.evaluate(baseDecision, maxAttemptCase, null, mockPolicy);
    expect(result.approved).toBe(false);
    expect(result.action).toBe('STOP' as const);
    expect(result.blockedReason).toContain('Maximum recovery attempts');
  });

  test('Blocks action when recovery probability is below threshold', () => {
    const lowProbDecision = { ...baseDecision, recoveryProbability: 0.35 };
    const result = policyEngine.evaluate(lowProbDecision, baseRecoveryCase, null, mockPolicy);
    expect(result.approved).toBe(false);
    expect(result.action).toBe('STOP' as const);
    expect(result.blockedReason).toContain('below minimum threshold');
  });

  test('Requires human approval for high-value transactions (> ₹10,000)', () => {
    const highValueCase: any = { ...baseRecoveryCase, amountAtRisk: 7500000 }; // ₹75,000
    const result = policyEngine.evaluate(baseDecision, highValueCase, null, mockPolicy);
    expect(result.approved).toBe(false);
    expect(result.requiresHumanApproval).toBe(true);
    expect(result.action).toBe('CREATE_PAYMENT_LINK' as const);
  });
});

