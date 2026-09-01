# System Architecture — RecoverAI

```
                         INTERNET
                            │
                            ▼
                    CloudFront / CDN
                            │
                            ▼
                     Load Balancer
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
        React Frontend              Node.js API
                                          │
                          ┌───────────────┼───────────────┐
                          │               │               │
                          ▼               ▼               ▼
                       MongoDB          Redis           Razorpay
                          │               │
                          │               ▼
                          │            BullMQ
                          │               │
                          │       ┌───────┼───────┐
                          │       │       │       │
                          │       ▼       ▼       ▼
                          │     AI      Retry   Notify
                          │    Worker   Worker   Worker
                          │
                          ▼
                     Analytics
```

## 1. Core Data Flow & The 8-Step Closed Loop

```
1. DETECT    → Razorpay webhook arrives (payment.failed)
2. DIAGNOSE  → Identify failure category (UPI timeout, bank server drop, card expired)
3. PREDICT   → AI calculates recovery probability (0-100%) based on customer history
4. DECIDE    → AI recommends bounded action (Payment Link, Reminder, Escalate, Stop)
5. GUARDRAIL → Deterministic Policy Engine checks caps, cooldown, amount limits
6. ACT       → Execute bounded Razorpay API call (e.g. create Payment Link)
7. VERIFY    → Webhook arrival (payment_link.paid) confirms settlement
8. RECOVER   → Mark case RECOVERED, adjust revenue KPIs, append immutable audit log
```

## 2. Queue & Background Processing (BullMQ + Redis)

- `webhook-queue`: Ingests raw Razorpay webhook events; ensures immediate HTTP 200 response to gateway.
- `ai-analysis-queue`: Dispatches failed cases to the AI Agent for diagnostic scoring and action selection.
- `recovery-queue`: Manages delayed retry executions and scheduled reminders with exponential backoff.
- `notification-queue`: Sends automated customer emails, SMS, and WhatsApp alerts through configured adapters.

## 3. Storage Layer

- **MongoDB Collections:** `merchants`, `users`, `customers`, `payments`, `recovery_cases`, `ai_decisions`, `recovery_attempts`, `recovery_policies`, `webhook_events`, `audit_logs`, `campaigns`.
- **Redis Use Cases:** Caching dashboard KPIs, BullMQ job states, distributed locking, and rate limiting.
