# 🚀 RecoverAI

## AI-Powered Intelligent Payment Recovery Platform

> **Recover failed payments. Recover revenue. Safely.**

### 🤖 AI recommends. 🛡️ Policy Engine authorizes. ⚡ System executes. 💰 Revenue gets recovered.

RecoverAI is an AI-powered payment recovery platform designed to help merchants intelligently recover failed payments while maintaining strict **financial safety, idempotency, security, human oversight, and performance guarantees**.

---

<div align="center">

### 🏆 KEY BENCHMARKS

|  🚀 Peak Load | ⚡ Peak Throughput | ✅ Error Rate | ⏱️ 1K VU p95 |
| :-----------: | :---------------: | :----------: | :----------: |
| **1,000 VUs** |  **2,164 req/s**  |   **0.00%**  |  **214 ms**  |

### 📈 DASHBOARD OPTIMIZATION

|          Before         |     After     |       Improvement       |
| :---------------------: | :-----------: | :---------------------: |
|     p95 **1,100 ms**    |   **107 ms**  |   🚀 **90.2% faster**   |
|     p99 **1,170 ms**    |   **128 ms**  |   🚀 **89.1% faster**   |
|      Avg **245 ms**     |  **38.69 ms** |   🚀 **84.2% faster**   |
|      **123 req/s**      | **304 req/s** | 🚀 **2.47× throughput** |
| MongoDB CPU **+159.6s** |   **+16.6s**  |  🚀 **~90% reduction**  |

### 🧪 AUTOMATED TESTING

**6 Test Suites · 21 Tests · 21 Passed · 0 Failed**

</div>

---

# ⭐ Why RecoverAI?

A payment failure should not necessarily be the end of the transaction.

Traditional flow:

```text
Customer
   ↓
Payment Attempt
   ↓
❌ Payment Failed
   ↓
END
```

RecoverAI turns it into:

```text
Customer
   ↓
Payment Attempt
   ↓
❌ Payment Failed
   ↓
Webhook
   ↓
🔐 Verify Signature
   ↓
🔁 Check Idempotency
   ↓
📦 Create Recovery Case
   ↓
🤖 AI Analysis
   ↓
🛡️ Policy Engine
   ↓
┌──────────────────────┐
│                      │
▼                      ▼
APPROVED             BLOCKED
│                      │
▼                      ▼
Recovery Action      STOP
│
▼
Customer Retry
│
▼
✅ Payment Captured
│
▼
Webhook
│
▼
⚙️ Worker
│
▼
💰 RECOVERED
│
▼
📊 Dashboard
```

---

# 🎯 The Core Innovation

The most important architectural decision in RecoverAI is:

```text
                    AI
                     │
                     │ Recommendation
                     ▼
             ┌───────────────┐
             │ Policy Engine │
             └───────┬───────┘
                     │
                     │ Authorization
                     ▼
            Recovery Service
                     │
                     │ Execution
                     ▼
              Payment System
```

### AI does NOT directly control money.

The AI can recommend:

```text
CREATE_PAYMENT_LINK
SEND_REMINDER
RETRY_PAYMENT
STOP
```

But the recommendation must pass through deterministic business policies before execution.

This creates a critical separation:

```text
AI Intelligence
       ≠
Financial Authorization
```

---

# 🏆 What Makes This Project Strong

RecoverAI combines several engineering concepts that normally appear separately:

```text
🤖 AI Decision Making
        +
🛡️ Deterministic Policy Guardrails
        +
🔐 Cryptographic Webhook Security
        +
🔁 Financial Idempotency
        +
👤 Human-in-the-Loop Approval
        +
⚙️ Asynchronous Workers
        +
🍃 MongoDB Query Optimization
        +
⚡ Redis Caching
        +
👥 RBAC
        +
🧪 Automated Testing
        +
📈 k6 Load Testing
```

The project is therefore not simply an AI demo or CRUD application.

It demonstrates how AI can be integrated into a **safety-critical financial workflow**.

---

# 📊 Performance Engineering

RecoverAI was benchmarked using **k6** across multiple concurrency levels.

## 🚀 Scaling Benchmark
![image alt](https://github.com/Amitprajapati111/RecoverAi/blob/main/Screenshot%202026-08-22%20173816.png?raw=true)

| Peak VUs | Total Requests |         Throughput | Avg Latency |           p95 | Error Rate |
| -------: | -------------: | -----------------: | ----------: | ------------: | ---------: |
|       50 |         15,486 |       154.81 req/s |     0.74 ms |       1.39 ms |     **0%** |
|      100 |         42,577 |       327.50 req/s |     0.68 ms |       1.30 ms |     **0%** |
|      500 |        146,788 |     1,333.82 req/s |    58.08 ms |     167.68 ms |     **0%** |
|    1,000 |        346,452 | **2,164.24 req/s** |    82.36 ms | **214.01 ms** |     **0%** |

### 1,000 VU Benchmark

```text
Peak VUs              1,000
Total Requests        346,452
Throughput            2,164.24 req/s
Average Latency       82.36 ms
Median Latency        68.56 ms
p90                   200.34 ms
p95                   214.01 ms
p99                   229.34 ms
Maximum               278.98 ms
HTTP Error Rate       0.00%
```

> **Note:** These are benchmark results from the tested local development environment and workload. They are not presented as production capacity guarantees.

---

# ⚡ Dashboard Performance Optimization

During the initial authenticated dashboard benchmark, a clear bottleneck appeared.

### Before Optimization

```text
100 VU

Average      245 ms
p95          1,100 ms
p99          1,170 ms
Throughput   ~123 req/s
```

MongoDB showed significant query computation during the dashboard workload.

---

## 🔧 Root Cause

The dashboard triggered multiple aggregation operations for:

```text
Dashboard KPIs
Recovery Funnel
Failure Breakdown
Recovery Trend
```

At higher concurrency, repeated aggregation work increased database pressure and pushed tail latency upward.

---

# 🚀 Optimization Applied

### 1️⃣ Compound MongoDB Indexes

Indexes were added/aligned around merchant and frequently queried fields.

Examples:

```javascript
{ merchantId: 1, createdAt: -1, status: 1 }

{ merchantId: 1, status: 1, failureType: 1, createdAt: -1 }

{ merchantId: 1, status: 1, createdAt: -1 }

{ merchantId: 1, createdAt: -1, amountAtRisk: 1, recoveredAmount: 1 }
```

### 2️⃣ Correct Merchant Scoping

Aggregation pipelines were aligned with the merchant's MongoDB `ObjectId`.

This allowed the query planner to use the relevant index prefixes rather than unnecessarily processing unrelated merchant data.

### 3️⃣ Redis Dashboard Cache

Dashboard aggregation responses use a short-lived cache.

```text
Cache Key:

recoverai:dashboard:${merchantId}:${days}

TTL:

30 seconds
```

Redis failures have fallback handling so the application can continue where possible.

---

# 📈 Optimization Results

```text
                 BEFORE       AFTER

p95               1100 ms       107 ms
                  ███████████   █

p99               1170 ms       128 ms
                  ███████████   █

Average             245 ms      38.69 ms
                  █████████     ██

Throughput          123 req/s   304 req/s
                  ███           ███████
```

### Result

* 🚀 **90.2% reduction in p95 latency**
* 🚀 **89.1% reduction in p99 latency**
* 🚀 **84.2% reduction in average latency**
* 🚀 **2.47× throughput improvement**
* 🚀 **~90% reduction in measured MongoDB CPU delta**
* ✅ **0% HTTP failures**

---

# 🔐 Webhook Security

Payment webhooks are a critical attack surface.

RecoverAI implements a security gate before processing payment events.

```text
Incoming Webhook
       │
       ▼
Signature Present?
       │
       ▼
HMAC-SHA256 Verification
       │
       ▼
Timing-Safe Comparison
       │
       ▼
Payload Validation
       │
       ▼
Idempotency Check
       │
       ▼
Queue Processing
```

## Tested Scenarios

| Scenario          | Expected           | Result |
| ----------------- | ------------------ | ------ |
| Valid signature   | `200 OK`           | ✅      |
| Invalid signature | `401 Unauthorized` | ✅      |
| Malformed payload | `400 Bad Request`  | ✅      |

The implementation uses:

```javascript
crypto.createHmac('sha256', secret)
crypto.timingSafeEqual(...)
```

This prevents forged webhook requests from entering the payment-processing pipeline.

---

# 🔁 Financial Idempotency

Payment systems must assume retries and duplicate event delivery.

RecoverAI protects against duplicate processing at two important layers.

## Webhook Idempotency

```text
Webhook Event ID

Delivery #1
     ↓
PROCESS

Delivery #2
     ↓
DUPLICATE

Delivery #3
     ↓
DUPLICATE
```

A unique database constraint on the webhook event identifier prevents the same event from being processed repeatedly.

---

## Recovery Action Idempotency

Recovery actions use deterministic SHA-256 based idempotency keys.

```text
Recovery Case
      +
Action
      +
Attempt Number
      ↓
SHA-256
      ↓
Unique Idempotency Key
```

Example:

```text
Call #1
→ CREATE_PAYMENT_LINK
→ Execute

Call #2
→ DUPLICATE
→ Existing result returned

Call #3
→ DUPLICATE
→ Existing result returned
```

This prevents accidental duplicate financial actions.

---

# 🛡️ Policy Engine Guardrails

RecoverAI treats AI recommendations as untrusted recommendations until policy validation succeeds.

## Rule 1: Low Probability

```text
AI Probability = 35%

Minimum Threshold = 55%

        ↓

❌ BLOCKED
```

---

## Rule 2: High-Value Transaction

```text
Amount = ₹15,000

Autonomous Approval Limit = ₹5,000

        ↓

⚠️ HUMAN APPROVAL REQUIRED
```

---

## Rule 3: Maximum Attempts

```text
Current Attempts = 3
Maximum Attempts = 3

        ↓

🛑 EXHAUSTED
```

---

## Rule 4: Successful Payment

```text
Payment Captured
       ↓
Recovery Case
       ↓
RECOVERED
       ↓
Recovered Amount Updated
```

---

# 👤 Human-in-the-Loop Architecture

RecoverAI does not blindly automate high-risk financial actions.

```text
                    AI
                    │
                    ▼
             Recommendation
                    │
                    ▼
             Policy Engine
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
       SAFE                HIGH RISK
          │                   │
          ▼                   ▼
      AUTOMATE          HUMAN APPROVAL
                              │
                              ▼
                         OWNER / ADMIN
                              │
                              ▼
                           EXECUTE
```

This provides a controlled path for high-value or sensitive recovery actions.

---

# 👥 Role-Based Access Control

RecoverAI implements five roles:

```text
OWNER
  ↓
ADMIN
  ↓
ANALYST
  ↓
SUPPORT
  ↓
VIEWER
```

### Permission Model

| Role    | Primary Access                                    |
| ------- | ------------------------------------------------- |
| OWNER   | Full system + sensitive payment credentials       |
| ADMIN   | Policies + recovery approvals + merchant settings |
| ANALYST | AI analysis + recovery inspection                 |
| SUPPORT | Customer communication + case inspection          |
| VIEWER  | Read-only dashboards and metrics                  |

### Example

```text
VIEWER
   │
   └── PUT /api/policies
              ↓
         ❌ 403 Forbidden
```

```text
ADMIN
   │
   └── PUT /api/policies
              ↓
         ✅ 200 OK
```

Sensitive Razorpay credential management is restricted to the `OWNER` role.

---

# ⚙️ Asynchronous Processing

Payment events should not require the HTTP request to wait for every downstream operation.

RecoverAI uses background processing:

```text
Webhook
   ↓
Validate
   ↓
Persist Event
   ↓
BullMQ
   ↓
Worker
   ↓
Recovery Processing
   ↓
Database Update
   ↓
Analytics
```

This separates request ingestion from asynchronous recovery work.

---

# 🍃 Data & Infrastructure

```text
                  RecoverAI API
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
      MongoDB        Redis        BullMQ
          │            │            │
          │            │            ▼
          │            │          Worker
          │            │            │
          └────────────┴────────────┘
                       │
                       ▼
                Recovery State
```

### MongoDB

Used for persistent application and recovery state.

### Redis

Used for caching and infrastructure requiring fast in-memory access.

### BullMQ

Used for asynchronous background jobs.

---

# 🧪 Automated Testing

Critical financial and security workflows are covered by automated tests.

## Latest Full Suite

```text
Test Suites: 6 passed
Tests:       21 passed
Failures:    0
```

### Covered

```text
✅ Encryption
✅ Policy Engine
✅ Webhook Idempotency
✅ Recovery Action Idempotency
✅ Recovery Edge Cases
✅ Webhook Security
✅ RBAC
```

---

# 🧪 Recovery Edge-Case Matrix

| Scenario        | Input   | Expected Behavior | Result |
| --------------- | ------- | ----------------- | ------ |
| Low probability | 35%     | Block recovery    | ✅      |
| High amount     | ₹15,000 | Human approval    | ✅      |
| Max attempts    | 3 / 3   | Stop / exhausted  | ✅      |
| Payment success | ₹3,500  | Mark recovered    | ✅      |

---

# 🚦 Rate Limiting

RecoverAI includes endpoint-level rate limiting.

Configured categories include:

```text
AUTH      → 10 requests / 15 minutes
API       → 100 requests / minute
AI        → 20 requests / minute
WEBHOOK   → 500 requests / minute
```

During testing, rate limiting was intentionally observed and verified.

Example:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many API requests, please slow down."
  }
}
```

For controlled k6 benchmarking, a dedicated `LOAD_TEST_MODE` was introduced so artificial development rate limits do not distort capacity measurements.

---

# 💳 Payment Simulator

RecoverAI includes a controlled test/demo environment for demonstrating the complete recovery lifecycle without transferring real money.

```text
🧪 TEST MODE
No real money is transferred.
```

The simulator can demonstrate scenarios such as:

```text
💸 Failed Payment
🤖 AI Analysis
🛡️ Policy Decision
👤 Human Approval
🔗 Recovery Payment Link
🔁 Duplicate Webhook
✅ Successful Payment
💰 Revenue Recovered
```

---

# 🎬 Recommended 5-Minute Demo

The strongest demo is not a feature tour.

It should tell one complete story.

## Scene 1: Payment Failure

```text
Customer attempts ₹3,500 payment
             ↓
Payment fails
             ↓
Failure reason displayed
```

---

## Scene 2: Webhook

```text
payment.failed
       ↓
HMAC verification
       ↓
Event accepted
       ↓
Idempotency check
       ↓
Queue
```

---

## Scene 3: AI Analysis

```text
Recovery Case Created

Probability:
82%

Recommended Action:
CREATE_PAYMENT_LINK
```

---

## Scene 4: Policy Engine

```text
AI Recommendation
       ↓
Policy Engine
       ↓
Probability OK
Amount OK
Attempts OK
       ↓
✅ APPROVED
```

---

## Scene 5: Recovery

```text
Payment Link Generated
       ↓
Customer retries
       ↓
Payment successful
```

---

## Scene 6: Captured Webhook

```text
payment.captured
       ↓
Signature verification
       ↓
Idempotency
       ↓
Worker
       ↓
Recovery = RECOVERED
```

---

## Scene 7: Dashboard

Show:

```text
Recovered Revenue
Recovery Rate
Failed Payments
Recovery Funnel
Recovery Cases
Payment Status
```

Then demonstrate one safety scenario:

```text
₹15,000
   ↓
Human Approval Required
   ↓
ADMIN / OWNER approval
```

Finally show duplicate webhook protection:

```text
Webhook #1 → Processed
Webhook #2 → Duplicate
```

This gives the evaluator a complete story:

> **Failure → Intelligence → Safety → Recovery → Verification → Revenue**

---

# 🏗️ High-Level Architecture

```text
                         ┌──────────────────┐
                         │     Customer     │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Payment Provider │
                         └────────┬─────────┘
                                  │
                         payment.failed
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │ Webhook Controller  │
                       └──────────┬──────────┘
                                  │
                          HMAC Verification
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │ Idempotency Layer   │
                       └──────────┬──────────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │      BullMQ         │
                       │       Queue         │
                       └──────────┬──────────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │       Worker        │
                       └──────────┬──────────┘
                                  │
                         ┌────────┴────────┐
                         │                 │
                         ▼                 ▼
                  ┌─────────────┐   ┌─────────────┐
                  │ AI Analysis │   │Policy Engine│
                  └──────┬──────┘   └──────┬──────┘
                         │                 │
                         └────────┬────────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │ Recovery Service    │
                       └──────────┬──────────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │ Payment Provider    │
                       └──────────┬──────────┘
                                  │
                         payment.captured
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │ Webhook + Worker    │
                       └──────────┬──────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │    RECOVERED    │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │    Dashboard    │
                         └─────────────────┘

          ┌──────────────┐        ┌──────────────┐
          │   MongoDB    │        │    Redis     │
          │ Persistent   │        │ Cache / Fast │
          │ State        │        │ Access       │
          └──────────────┘        └──────────────┘
```

---

# 💻 Technology Stack

### Frontend

```text
React
TypeScript
Modern Dashboard UI
```

### Backend

```text
Node.js
Express
TypeScript
JWT Authentication
RBAC
```

### Database

```text
MongoDB
Mongoose
```

### Infrastructure

```text
Redis
BullMQ
```

### AI

```text
AI Recovery Analysis
Recovery Probability
Action Recommendation
```

### Payments

```text
Razorpay
Payment Links
Payment Events
Webhooks
Test/Simulation Mode
```

### Security

```text
JWT
RBAC
HMAC-SHA256
Timing-Safe Signature Verification
Encryption
Idempotency
Rate Limiting
```

### Testing

```text
Jest
Integration Tests
k6 Load Testing
Performance Profiling
```

---

# 📁 Project Structure

```text
RecoverAI/
│
├── client/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── ...
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── workers/
│   │   ├── config/
│   │   ├── routes/
│   │   └── __tests__/
│   │
│   └── ...
│
├── load-test.js
├── README.md
└── ...
```

---

# 🚀 Getting Started

## Clone

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd RecoverAI
```

## Backend

```bash
cd server
npm install
npm run dev
```

Backend:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

## Frontend

```bash
cd client
npm install
npm run dev
```

---

# 🧪 Run Tests

```bash
cd server
npx jest --forceExit
```

Expected result:

```text
6 Test Suites Passed
21 Tests Passed
0 Failed
```

---

# 📈 Run Load Test

From project root:

```bash
k6 run load-test.js
```

---

# 🔐 Environment Variables

Example local configuration:

```env
MONGODB_URI=mongodb://localhost:27017/recoverai
REDIS_URL=redis://localhost:6379
LOAD_TEST_MODE=false
```

Additional application secrets should be configured through environment variables.

### Never commit:

```text
.env
JWT secrets
Razorpay secrets
Webhook secrets
Encryption keys
API credentials
```

---

# 📌 Engineering Decisions

## Why Redis?

To reduce repeated dashboard aggregation work and improve read latency.

## Why MongoDB Compound Indexes?

Because dashboard queries frequently filter by merchant and then use status/date-related fields.

## Why BullMQ?

To move asynchronous processing away from the synchronous API request path.

## Why Idempotency?

Because payment providers and networks can retry requests and webhook deliveries.

## Why Policy Engine?

Because AI output should not directly authorize financial actions.

## Why RBAC?

Because different users should have different levels of access to sensitive financial operations.

## Why Human Approval?

Because high-value financial actions should be capable of being escalated instead of blindly automated.

## Why k6?

To quantify concurrency, throughput, latency, and failure behavior instead of relying on manual testing.

---

# 🧠 Engineering Lessons

RecoverAI was designed around a key principle:

> **A financially intelligent system must be correct, safe, observable, and recoverable, not merely fast.**

The project demonstrates practical engineering around:

```text
AI Systems
      +
Backend Architecture
      +
Distributed Processing
      +
Database Optimization
      +
Caching
      +
Security
      +
Authorization
      +
Financial Idempotency
      +
Testing
      +
Performance Engineering
```

---

# 🔮 Future Improvements

Potential production-oriented extensions include:

* Adaptive recovery strategies based on historical outcomes
* ML-based recovery probability models
* Customer segmentation
* Recovery strategy experimentation
* Multi-payment-provider support
* Advanced fraud/risk scoring
* Horizontal worker scaling
* Distributed deployment
* Observability with metrics and tracing
* Advanced notification optimization
* Merchant-specific policy configuration
* Recovery strategy A/B testing

---

# 📸 Demo & Evidence

Add your actual project evidence here:

### 🎥 Demo Video

`[ Watch the 5-Minute Demo ]`

### 🖥️ Live Demo

`[ Open RecoverAI ]`

### 📊 Performance Report

`[ View Benchmark Results ]`

### 🧪 Test Report

`[ View Test Results ]`

### 🏗️ Architecture

`[ View Architecture Diagram ]`

---

# 🏆 Project Highlights

<div align="center">

### 🤖 AI

**Recovery Intelligence**

### 🛡️ POLICY

**Deterministic Guardrails**

### 🔐 SECURITY

**HMAC + RBAC + Encryption**

### 🔁 IDEMPOTENCY

**Duplicate Financial Action Protection**

### ⚡ PERFORMANCE

**2,164 req/s @ 1,000 VUs**

### 📈 OPTIMIZATION

**90.2% Dashboard p95 Improvement**

### 🧪 TESTING

**21/21 Automated Tests Passed**

### 👤 HUMAN CONTROL

**High-Risk Approval Workflow**

</div>

---

# 🥇 The One-Line Pitch

> **RecoverAI is an AI-powered payment recovery platform where AI recommends recovery strategies, deterministic policies authorize them, secure webhooks and idempotency protect financial operations, and automated recovery turns failed payments into recovered revenue.**

---

# 👨‍💻 Author

## Amit

**Software Engineer | Full-Stack Developer**

Built using:

```text
React
TypeScript
Node.js
Express
MongoDB
Redis
BullMQ
AI
Razorpay
Jest
k6
```

---

# 📜 Disclaimer

RecoverAI's demonstration and simulator flows are intended for controlled testing and demonstration.

> **TEST MODE — No real money is transferred.**

Production deployment requires appropriate payment-provider configuration, secret management, infrastructure hardening, monitoring, compliance controls, and security review.
