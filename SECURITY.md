# Security, Privacy & Guardrails — RecoverAI

## 1. The Deterministic Guardrail Layer (`PolicyEngine`)

The AI recommendation MUST pass through the PolicyEngine before any action is scheduled:

```text
AI Recommendation
       │
       ▼
 PolicyEngine (Deterministic)
       │
   ┌───┴───┐
   │       │
Approved  Blocked / Human Review
   │       │
Execute   Queue / Escalate
```

### Enforced Guardrails:
1. **Customer Opt-Out:** If a customer has opted out, all recovery interventions are immediately STOPPED.
2. **Attempt Caps:** Maximum attempt limit (default: 3) strictly enforced; stops repeated messaging.
3. **Probability Floor:** If AI probability is below merchant threshold (e.g. 55%), recovery is aborted.
4. **Amount Limits:** Transactions exceeding the high-value threshold (e.g. ₹10,000) require mandatory human approval.
5. **Cooldown Windows:** Minimum wait time between retry attempts (e.g. 30 min) to prevent spam.

## 2. Multi-Tenancy & Tenant Isolation

- Every database query enforces `merchantId` scope derived solely from the authenticated JWT.
- Clients can never supply or override `merchantId` in request parameters.

## 3. Secret Management & PII Sanitization

- Razorpay API secrets are symmetrically encrypted using AES-256-CBC before storage.
- Credit card numbers, CVVs, and sensitive authentication credentials are never passed to LLMs.
- Webhook signatures are validated using timing-safe HMAC SHA-256 comparisons.
