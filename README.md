# 🚀 RecoverAI

### AI-Powered Payment Recovery & Intelligent Revenue Recovery Platform

> **RecoverAI helps merchants recover failed payments safely using AI-powered recommendations, deterministic policy guardrails, secure webhooks, idempotent recovery actions, asynchronous processing, and real-time recovery analytics.**

**AI recommends. Policy Engine authorizes.**

---

## 🎯 The Problem

A failed payment does not necessarily mean lost revenue.

Payments can fail because of:

* Insufficient funds
* Bank declines
* Bank timeouts
* UPI timeouts
* Customer abandonment
* Temporary payment failures

Traditional payment systems often stop at:

```text
Payment Failed
      ↓
Transaction marked FAILED
      ↓
End
```

RecoverAI changes this into:

```text
Payment Failed
      ↓
Failure Detected
      ↓
Webhook Verification
      ↓
Recovery Case
      ↓
AI Analysis
      ↓
Policy Engine
      ↓
Recovery Action
      ↓
Customer Retry
      ↓
Payment Captured
      ↓
Recovered Revenue
```

The objective is simple:

> **Don't just record failed payments. Recover them safely.**

---

# 🧠 Core Idea

RecoverAI separates **AI intelligence** from **financial authorization**.

```text
                 ┌───────────────────┐
                 │   Failed Payment  │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │ Webhook Security  │
                 │ HMAC + Validation │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │   Recovery Case   │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │    AI Analysis    │
                 │ Probability/Plan  │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │   Policy Engine   │
                 │   Authorization   │
                 └─────────┬─────────┘
                           │
                 ┌─────────┴─────────┐
                 │                   │
                 ▼                   ▼
             APPROVED             BLOCKED
                 │                   │
                 ▼                   ▼
        Recovery Action          STOP/ESCALATE
                 │
                 ▼
          Customer Payment
                 │
                 ▼
        payment.captured
                 │
                 ▼
             RECOVERED
```

### Key principle

```text
AI ≠ Financial Authority

AI → Recommendation
Policy Engine → Authorization
Recovery Service → Execution
Payment Gateway → Transaction
```

---

# ✨ Key Features

## 💳 Intelligent Payment Recovery

RecoverAI detects failed payments and creates recovery cases that can move through an automated recovery lifecycle.

Supported recovery states include:

```text
NEW
ANALYZING
RECOVERABLE
NOT_RECOVERABLE
IN_RECOVERY
RECOVERED
EXHAUSTED
ESCALATED
STOPPED
```

---

## 🤖 AI-Powered Recovery Analysis

The AI analyzes payment/recovery context and produces:

* Recovery probability
* Risk assessment
* Recommended recovery action
* Reasoning/context for the recommendation

Example:

```text
Recovery Probability: 82%

Risk: LOW

Recommended Action:
CREATE_PAYMENT_LINK
```

However, AI recommendations are never directly executed.

Every recommendation must pass through the Policy Engine.

---

# 🛡️ Deterministic Policy Engine

The Policy Engine acts as a safety boundary between AI recommendations and financial actions.

Example policy rules:

### Recovery Probability

```text
Probability < 55%
        ↓
BLOCK
```

### High-Value Transaction

```text
Amount > ₹5,000
        ↓
Human Approval Required
```

### Maximum Attempts

```text
Attempts >= 3
        ↓
STOP / EXHAUSTED
```

### Normal Recoverable Payment

```text
Probability >= threshold
        +
Amount within autonomous limit
        +
Attempts < maximum
        ↓
APPROVED
```

This prevents the AI from blindly executing financial actions.

---

# 👤 Human-in-the-Loop Recovery

High-risk financial actions can be escalated to humans.

Example:

```text
Amount:
₹15,000

Recovery Probability:
88%

Policy:
Autonomous limit = ₹5,000

Result:
ESCALATED

requiresHumanApproval:
true
```

Only authorized roles such as `OWNER` and `ADMIN` can approve sensitive recovery actions.

---

# 🔐 Webhook Security

Payment webhooks are protected using multiple security layers.

### HMAC-SHA256 Signature Verification

Incoming webhook signatures are verified using the configured webhook secret.

The implementation uses:

```text
crypto.createHmac()
crypto.timingSafeEqual()
```

This protects the webhook boundary against forged or tampered requests.

### Payload Validation

Malformed events are rejected before entering the processing pipeline.

Example:

```text
Invalid Signature
        ↓
401 Unauthorized
```

```text
Malformed Payload
        ↓
400 Bad Request
```

```text
Valid Webhook
        ↓
200 OK
        ↓
Async Processing
```

---

# 🔁 Idempotency & Duplicate Protection

Payment infrastructure must assume that events can be delivered more than once.

RecoverAI implements idempotency at multiple levels.

## Webhook Idempotency

Webhook events use a unique event identifier.

Example:

```text
Delivery 1
→ PROCESSED

Delivery 2
→ DUPLICATE

Delivery 3
→ DUPLICATE
```

Duplicate deliveries do not create duplicate recovery processing.

---

## Recovery Action Idempotency

Recovery actions use deterministic idempotency keys based on recovery context.

The implementation uses SHA-256 based idempotency keys and unique database constraints.

Example:

```text
CREATE_PAYMENT_LINK

First request:
→ Payment Link Created

Second request:
→ Existing Result Returned

Third request:
→ Existing Result Returned
```

This prevents duplicate financial actions such as accidentally creating multiple payment links.

---

# 🔐 Role-Based Access Control

RecoverAI implements a five-level role hierarchy:

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

### Role Responsibilities

| Role    | Capabilities                                                          |
| ------- | --------------------------------------------------------------------- |
| OWNER   | Full system access, sensitive payment credentials, financial controls |
| ADMIN   | Policy configuration, recovery approvals, merchant settings           |
| ANALYST | AI analysis, recovery inspection, analytics                           |
| SUPPORT | Customer communication and case inspection                            |
| VIEWER  | Read-only dashboard and metrics                                       |

Sensitive routes are protected using role guards.

Example:

```text
VIEWER
   ↓
PUT /api/policies
   ↓
403 Forbidden
```

While:

```text
ADMIN
   ↓
PUT /api/policies
   ↓
200 OK
```

This enforces the principle of least privilege.

---

# ⚙️ Asynchronous Processing

RecoverAI uses background processing for operations that should not block the HTTP request lifecycle.

High-level flow:

```text
Webhook
   ↓
Validate
   ↓
Persist Event
   ↓
Queue Job
   ↓
BullMQ
   ↓
Worker
   ↓
Recovery Processing
   ↓
Database Update
```

This separates:

* API responsiveness
* payment event ingestion
* AI processing
* recovery execution
* notification/background work

---

# 🚀 Redis

Redis is used for infrastructure and performance-sensitive workloads including:

* Dashboard caching
* Queue infrastructure
* Fast access to frequently requested data

The dashboard caching layer uses a short TTL to avoid unnecessary repeated aggregation work.

Example cache key:

```text
recoverai:dashboard:${merchantId}:${days}
```

Dashboard cache TTL:

```text
30 seconds
```

Cache failures are handled gracefully using existing fallback behavior.

---

# 🍃 MongoDB Optimization

During load testing, the dashboard aggregation pipeline became a measurable bottleneck.

The initial dashboard benchmark showed approximately:

```text
p95:
1.1 seconds
```

MongoDB was performing significant aggregation work.

The optimization included:

### Compound Indexes

Examples:

```text
{ merchantId: 1, createdAt: -1, status: 1 }

{ merchantId: 1, status: 1, failureType: 1, createdAt: -1 }

{ merchantId: 1, status: 1, createdAt: -1 }

{ merchantId: 1, createdAt: -1, amountAtRisk: 1, recoveredAmount: 1 }
```

### Query Scoping

Aggregation pipelines were aligned around:

```text
merchantId
```

using the correct MongoDB ObjectId representation.

### Result

After indexing and Redis caching:

```text
Dashboard p95:

~1100 ms
     ↓
~107 ms
```

Approximately:

```text
90% latency reduction
```

Throughput improved from approximately:

```text
123 req/s
     ↓
304 req/s
```

under the tested dashboard workload.

---

# 📊 Performance Engineering

RecoverAI was load tested using **k6**.

## Health Endpoint Scaling

Tested up to:

```text
1,000 VUs
```

Observed peak:

```text
~2,164 requests/sec
```

Error rate:

```text
0.00%
```

---

## Scaling Results

|   VUs | Requests |     Throughput | Avg Latency |       p95 | Errors |
| ----: | -------: | -------------: | ----------: | --------: | -----: |
|    50 |   15,486 |   ~154.8 req/s |    ~0.74 ms |  ~1.39 ms |     0% |
|   100 |   42,577 |   ~327.5 req/s |    ~0.68 ms |  ~1.30 ms |     0% |
|   500 |  146,788 | ~1,333.8 req/s |    ~58.1 ms | ~167.7 ms |     0% |
| 1,000 |  346,452 | ~2,164.2 req/s |    ~82.4 ms | ~214.0 ms |     0% |

These results represent the tested local development environment and workload, not a claim of production capacity.

---

# 📈 Dashboard Performance Optimization

### Before Optimization

```text
100 VU

Average:
245 ms

p95:
1,100 ms

p99:
1,170 ms

Throughput:
~123 req/s
```

### After Optimization

```text
100 VU

Average:
38.69 ms

p95:
107.29 ms

p99:
128.05 ms

Throughput:
~304 req/s

Error Rate:
0%
```

### Improvement

```text
p95 latency:
~90% reduction

Throughput:
~2.47× increase
```

This optimization was driven by identifying the database aggregation bottleneck and combining query/index improvements with Redis caching.

---

# 🧪 Automated Testing

RecoverAI includes unit and integration tests covering critical financial workflows.

Latest full suite:

```text
Test Suites: 6 passed
Tests:       21 passed
```

Covered areas include:

```text
✓ Encryption
✓ Policy Engine
✓ Webhook Idempotency
✓ Recovery Action Idempotency
✓ Recovery Edge Cases
✓ Webhook Security
✓ RBAC
```

---

# 🧪 Recovery Edge Cases

The system was tested against important recovery safety scenarios.

## 1. Low Recovery Probability

```text
Probability:
35%

Minimum:
55%

Result:
BLOCKED
```

---

## 2. High-Value Transaction

```text
Amount:
₹15,000

Result:
HUMAN APPROVAL REQUIRED
```

---

## 3. Maximum Attempts

```text
Attempts:
3 / 3

Result:
EXHAUSTED
```

---

## 4. Successful Payment

```text
Payment:
₹3,500

Result:
RECOVERED
```

---

# 🔄 End-to-End Recovery Lifecycle

The primary RecoverAI flow is:

```text
Customer
   ↓
Payment Attempt
   ↓
Payment Failed
   ↓
payment.failed Webhook
   ↓
Signature Verification
   ↓
Idempotency Check
   ↓
Recovery Case
   ↓
AI Analysis
   ↓
Policy Engine
   ↓
┌───────────────────────┐
│                       │
▼                       ▼
APPROVED             BLOCKED
│                       │
▼                       ▼
Recovery Action       STOP
│
▼
Payment Link / Retry
│
▼
Customer Payment
│
▼
payment.captured
│
▼
Webhook Verification
│
▼
Worker
│
▼
Recovery Case
│
▼
RECOVERED
│
▼
Dashboard Analytics
```

---

# 💻 Technology Stack

## Frontend

```text
React
TypeScript
Modern component-based UI
Responsive dashboard
```

## Backend

```text
Node.js
Express
TypeScript
JWT Authentication
RBAC
```

## Data & Infrastructure

```text
MongoDB
Mongoose
Redis
BullMQ
```

## AI

```text
AI-powered payment recovery analysis
Recovery probability estimation
Action recommendation
```

## Payments

```text
Razorpay Test Mode
Payment Events
Payment Links
Webhooks
```

## Security

```text
JWT
RBAC
HMAC-SHA256
crypto.timingSafeEqual
Encryption
Idempotency
Rate Limiting
```

## Testing & Performance

```text
Jest
Integration Testing
k6
Load Testing
Performance Profiling
```

---

# 🏗️ High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      Customer       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Payment / Razorpay  │
                         └──────────┬──────────┘
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
                         │      Worker         │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
          ┌──────────────────┐             ┌──────────────────┐
          │   AI Analysis    │             │   Policy Engine  │
          └────────┬─────────┘             └────────┬─────────┘
                   │                                │
                   └───────────────┬────────────────┘
                                   │
                                   ▼
                         ┌─────────────────────┐
                         │  Recovery Service   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Payment Provider    │
                         └──────────┬──────────┘
                                    │
                              Payment Captured
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Webhook + Worker    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Recovery = RECOVERED│
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Analytics Dashboard │
                         └─────────────────────┘

       ┌──────────────┐              ┌──────────────┐
       │   MongoDB    │              │    Redis     │
       │ Transactional│              │ Cache/Queue  │
       │    State     │              │ Infrastructure│
       └──────────────┘              └──────────────┘
```

---

# 🔒 Security Architecture

RecoverAI follows multiple security boundaries:

```text
Authentication
      ↓
JWT
      ↓
RBAC
      ↓
Input Validation
      ↓
Webhook Signature Verification
      ↓
Idempotency
      ↓
Policy Engine
      ↓
Authorized Recovery Action
```

Sensitive payment credentials are protected and are never intended to be exposed through the frontend.

---

# 🎮 Demo Mode

RecoverAI includes a controlled test/demo environment.

```text
TEST MODE
```

The demo allows simulation of:

* Failed payment
* Successful payment
* AI analysis
* Policy approval
* Human approval
* Low-probability blocking
* Maximum-attempt exhaustion
* Duplicate webhook delivery

### Important

```text
TEST MODE — No real money is transferred.
```

Demo mode does not replace the core security architecture.

---

# 🎬 Winning Demo Flow

The recommended project demonstration is:

```text
1. Customer starts a ₹3,500 payment

2. Payment fails because of insufficient funds

3. payment.failed webhook arrives

4. Signature is verified

5. Duplicate protection is checked

6. Recovery Case is created

7. AI calculates recovery probability

8. AI recommends CREATE_PAYMENT_LINK

9. Policy Engine evaluates the recommendation

10. Policy Engine approves

11. Recovery payment link is created

12. Customer retries payment

13. Payment succeeds

14. payment.captured webhook arrives

15. Webhook is verified

16. Worker processes the event

17. Recovery Case becomes RECOVERED

18. Dashboard updates recovered revenue

19. Audit trail records the complete lifecycle
```

---

# 🧩 Safety Demonstration

RecoverAI can also demonstrate:

### Low Probability

```text
35%
↓
Policy threshold: 55%
↓
BLOCKED
```

### High Value

```text
₹15,000
↓
Autonomous limit exceeded
↓
HUMAN APPROVAL
```

### Maximum Attempts

```text
3 / 3
↓
EXHAUSTED
↓
STOP
```

### Duplicate Webhook

```text
First delivery
↓
PROCESSED

Second delivery
↓
DUPLICATE

No duplicate recovery action
```

These scenarios demonstrate that the system is designed for controlled automation rather than unrestricted AI execution.

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

## 1. Clone

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd RecoverAI
```

## 2. Install dependencies

### Server

```bash
cd server
npm install
```

### Client

```bash
cd ../client
npm install
```

---

## 3. Configure Environment

Create the required environment configuration based on the project's existing `.env` setup.

Example:

```env
MONGODB_URI=mongodb://localhost:27017/recoverai
REDIS_URL=redis://localhost:6379

LOAD_TEST_MODE=false
DEMO_MODE=true
```

Never commit secrets.

Do not commit:

```text
.env
JWT_SECRET
RAZORPAY_KEY_SECRET
WEBHOOK_SECRET
ENCRYPTION_KEY
```

---

# ▶️ Run the Project

## Backend

```bash
cd server
npm run dev
```

Backend:

```text
http://localhost:5000
```

Health:

```text
http://localhost:5000/health
```

## Frontend

```bash
cd client
npm run dev
```

---

# 🧪 Run Tests

From the server directory:

```bash
npx jest --forceExit
```

Expected critical test coverage includes:

```text
Encryption
Policy Engine
Idempotency
Recovery Edge Cases
Webhook Security
RBAC
```

---

# 📊 Run Load Test

From the project root:

```bash
k6 run load-test.js
```

The load-testing configuration can be adjusted according to the desired workload.

For controlled performance experiments, the project supports a dedicated load-test configuration that prevents development rate limits from artificially limiting benchmark traffic.

---

# 📌 Engineering Highlights

The strongest engineering aspects of RecoverAI are:

### 1. AI + Deterministic Safety

AI produces recommendations, while the Policy Engine controls authorization.

### 2. Financial Idempotency

Duplicate webhook deliveries and repeated recovery actions are prevented from creating duplicate financial operations.

### 3. Secure Webhooks

HMAC-SHA256 verification and timing-safe comparison protect the payment event boundary.

### 4. Human-in-the-Loop

High-risk transactions can be escalated rather than autonomously executed.

### 5. Distributed Processing

BullMQ workers separate asynchronous recovery processing from API requests.

### 6. Database Optimization

Compound indexes and correctly scoped aggregation pipelines reduce MongoDB query workload.

### 7. Redis Caching

Dashboard aggregation results are cached to reduce repeated database computation.

### 8. RBAC

Five roles enforce least-privilege access to financial and operational actions.

### 9. Automated Testing

Critical security, policy, idempotency, and recovery workflows are covered by automated tests.

### 10. Performance Engineering

The system was benchmarked using k6 across 50, 100, 500 and 1,000 VU levels.

---

# 🏆 What I Learned

Building RecoverAI required thinking beyond simply making APIs work.

The project involved solving problems around:

```text
AI reliability
Financial safety
Distributed systems
Database performance
Caching
Asynchronous processing
Webhook security
Idempotency
Authorization
Testing
Load testing
Observability
```

One of the most important lessons was:

> **In financial systems, correctness and safety matter just as much as raw performance.**

A fast system that executes the same financial action twice is still a broken system.

---

# 🔮 Future Improvements

Potential future improvements include:

* Adaptive recovery strategies based on historical outcomes
* More sophisticated customer segmentation
* ML-based recovery prediction
* Notification channel optimization
* Advanced fraud/risk scoring
* Multi-provider payment support
* Production-grade distributed deployment
* Horizontal worker scaling
* Advanced observability with metrics and tracing
* Automated recovery strategy experimentation
* Merchant-level policy customization
* A/B testing of recovery strategies

---

# 👨‍💻 Author

**Amit**

Software Engineer | Full-Stack Developer

Built with:

```text
React
Node.js
TypeScript
MongoDB
Redis
BullMQ
AI
Razorpay
Jest
k6
```

---

# ⭐ Project Philosophy

RecoverAI is built around one principle:

```text
                    AI
                     │
              Recommendation
                     │
                     ▼
              Policy Engine
                     │
               Authorization
                     │
                     ▼
             Recovery Service
                     │
                Execution
                     │
                     ▼
               Payment System
```

### AI should make systems smarter.

### Policies should make them safer.

### Engineering should make them reliable.

---

## 📜 Disclaimer

RecoverAI's payment demonstrations use test/demo flows.

**TEST MODE — No real money is transferred.**

Production payment credentials, secrets, and sensitive financial information must never be committed to source control.
