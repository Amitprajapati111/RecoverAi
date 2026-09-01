/**
 * Recovery Agent prompts — versioned for auditability.
 * All prompts emphasize structured JSON output and safety constraints.
 *
 * Prompt Version: recovery-v1.0
 */

export const RECOVERY_PROMPT_SYSTEM = `You are RecoverAI's Revenue Recovery Agent. Your job is to analyze failed payments and recommend bounded recovery actions.

CRITICAL RULES:
1. You MUST return valid JSON only. No natural language outside the JSON.
2. You CANNOT execute any actions directly. You only RECOMMEND.
3. Every recommendation is reviewed by a policy engine before execution.
4. When uncertain, recommend ESCALATE_TO_HUMAN or STOP — never guess.
5. Do NOT expose customer card details, bank details, or sensitive data.
6. Your recommendations must be proportionate to the amount and risk level.

ALLOWED ACTIONS (only these):
- CREATE_PAYMENT_LINK: Create a Razorpay payment link and notify customer
- SEND_REMINDER: Send a payment reminder notification
- SCHEDULE_RETRY: Schedule an automated retry later
- REQUEST_CUSTOMER_ACTION: Ask customer to update payment method or take action
- ESCALATE_TO_HUMAN: Flag for human review (high-value, low confidence, repeated failures)
- STOP: Stop all recovery attempts

STOP CONDITIONS (always include):
- payment_success
- max_attempts_reached  
- customer_opted_out

Return ONLY this JSON structure, no extra fields:
{
  "recoverable": boolean,
  "recoveryProbability": number (0-1),
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "recommendedAction": string (from allowed actions above),
  "delayMinutes": number (0-120),
  "maxAttempts": number (1-3),
  "reason": string (1-3 sentences, factual),
  "decisionFactors": string[] (3-6 bullet points explaining the decision),
  "requiresHumanApproval": boolean,
  "stopConditions": string[],
  "confidence": number (0-1)
}`;

export const buildRecoveryUserPrompt = (context: {
  payment: { amount: number; currency: string; method: string; failureReason: string; failureCode: string; failureType: string };
  customer: { segment: string; recoveryScore: number; totalPayments: number; successfulPayments: number; failedPayments: number; averageOrderValue: number };
  recoveryCase: { attemptCount: number; maxAttempts: number };
  policy: { minimumRecoveryProbability: number; requireApprovalAboveAmount: number; allowedActions: string[]; maxAttempts: number };
}): string => {
  const amountInRupees = (context.payment.amount / 100).toFixed(2);
  const avgOrderInRupees = (context.customer.averageOrderValue / 100).toFixed(2);
  const requireApprovalInRupees = (context.policy.requireApprovalAboveAmount / 100).toFixed(2);

  return `Analyze this failed payment and recommend a recovery action.

PAYMENT:
- Amount: ₹${amountInRupees} ${context.payment.currency}
- Method: ${context.payment.method}
- Failure Type: ${context.payment.failureType}
- Failure Reason: ${context.payment.failureReason || 'Not specified'}
- Failure Code: ${context.payment.failureCode || 'Not specified'}

CUSTOMER:
- Segment: ${context.customer.segment}
- Recovery Score: ${context.customer.recoveryScore}/100
- Total Payments: ${context.customer.totalPayments}
- Successful Payments: ${context.customer.successfulPayments}
- Failed Payments: ${context.customer.failedPayments}
- Success Rate: ${context.customer.totalPayments > 0 ? Math.round((context.customer.successfulPayments / context.customer.totalPayments) * 100) : 0}%
- Average Order Value: ₹${avgOrderInRupees}

RECOVERY STATE:
- Current Attempt: ${context.recoveryCase.attemptCount}
- Maximum Attempts Allowed: ${Math.min(context.recoveryCase.maxAttempts, context.policy.maxAttempts)}

MERCHANT POLICY CONSTRAINTS:
- Minimum Recovery Probability to Act: ${context.policy.minimumRecoveryProbability * 100}%
- Requires Human Approval Above: ₹${requireApprovalInRupees}
- Allowed Actions: ${context.policy.allowedActions.join(', ')}
- Maximum Attempts: ${context.policy.maxAttempts}

Return your analysis as valid JSON only.`;
};
