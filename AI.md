# AI Engine, Guardrails & Explainability — RecoverAI

## 1. Core AI Philosophy: Action-Oriented & Bounded

RecoverAI does NOT use unconstrained LLM chatbots. The AI agent:
1. Receives sanitized payment context and customer history.
2. Returns a strict, validated **JSON schema**.
3. Recommends bounded tool calls (`CREATE_PAYMENT_LINK`, `SEND_REMINDER`, `SCHEDULE_RETRY`, `ESCALATE_TO_HUMAN`, `STOP`).
4. **Never executes financial transactions directly.**

## 2. Structured Output Schema

Every decision produces:
```json
{
  "recoverable": true,
  "recoveryProbability": 0.87,
  "riskLevel": "LOW",
  "priority": "HIGH",
  "recommendedAction": "CREATE_PAYMENT_LINK",
  "delayMinutes": 15,
  "maxAttempts": 2,
  "reason": "Customer has completed 8 of last 9 payments successfully and current failure appears temporary.",
  "decisionFactors": [
    "Customer payment success rate: 89% (8/9 payments)",
    "Failure type: UPI_TIMEOUT (temporary server timeout)",
    "Customer segment: LOYAL",
    "Recovery score: 88/100",
    "Estimated recovery probability: 87%"
  ],
  "requiresHumanApproval": false,
  "stopConditions": ["payment_success", "max_attempts_reached", "customer_opted_out"],
  "confidence": 0.88
}
```

## 3. Provider Abstraction Layer

- `MockAIProvider`: High-speed deterministic scoring engine. Allows full hackathon demo execution without requiring an OpenAI or Anthropic key.
- `OpenAIProvider`: Production-grade GPT-4o-mini implementation with strict JSON mode.
- `AnthropicProvider`: Claude 3.5 Sonnet adapter with tool-use formatting.

## 4. Controlled Tool-Calling in "Ask RecoverAI"

The natural language interface queries internal revenue models using safe, registered tools:
- `getRevenueAtRisk()`
- `getRecoveredRevenue()`
- `getTopFailureReasons()`
- `getRecoveryStrategyStats()`
- `getGeneralSummary()`
Arbitrary SQL or NoSQL execution is strictly forbidden.
