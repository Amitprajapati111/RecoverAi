# RecoverAI — Turn Failed Payments into Recovered Revenue

> **Track 03: AI Revenue Recovery** | Razorpay Hackathon 2026  
> **Tagline:** *"Turn failed payments into recovered revenue."*  
> **Internal Description:** AI Revenue Recovery Orchestrator for Razorpay Merchants

---

## 1. Executive Summary & Core Philosophy

Merchants lose billions annually because of payment timeouts, bank server drops, expired cards, and checkout abandonments. Standard payment gateways treat these failures as isolated, dead-end events.

**RecoverAI** transforms isolated payment dropouts into an automated, bounded revenue recovery engine. It does not merely detect failures — it closes the loop:

```
DETECT → DIAGNOSE → PREDICT → DECIDE → ACT → VERIFY → RECOVER → LEARN
```

The system is designed with a **Deterministic Guardrail Layer** sitting between the AI Agent and the Razorpay API. The AI produces structured JSON recommendations and bounded tool calls, while the Policy Engine enforces hard financial limits, cooldowns, and human approval queues.

---

## 2. Key Modules Built

1. **Autonomous Recovery Orchestrator** (8-step closed loop)
2. **AI Decision Center** (Structured JSON output, model versioning, confidence scoring, explainability factors)
3. **Deterministic Policy Engine** (Guardrails for max attempts, amount caps, cooldowns, customer opt-outs)
4. **Human Approval Center** (High-value & low-confidence human-in-the-loop review queue)
5. **Razorpay Test Mode Integration** (Payment Links API, webhook signature verification, idempotency)
6. **Demo Simulator** (1-Click "Winning Demo" scenario, 100 / 1,000 / 10,000 synthetic transaction generator)
7. **Ask RecoverAI** (Conversational assistant with safe internal analytics tool-calling)
8. **Revenue Funnel & A/B Experiments** (Strategy benchmark comparison, failure type heatmaps)
9. **Immutable Audit Trail** (Actor-tagged logs for AI, USER, SYSTEM, and RAZORPAY)
10. **Enterprise RBAC & Multi-Tenancy** (Tenant isolation, JWT auth, encrypted secrets)

---

## 3. Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Recharts, React Router
- **Backend:** Node.js, Express, TypeScript, Zod, Winston
- **Database & Cache:** MongoDB 7.0 (Mongoose), Redis 7.2 (ioredis)
- **Queues & Workers:** BullMQ (webhook, AI analysis, recovery action workers)
- **AI Abstraction:** Provider pattern (`MockAIProvider`, `OpenAIProvider`, `AnthropicProvider`)
- **Payment Gateway:** Razorpay Test Mode SDK & Webhooks
- **DevOps & Containerization:** Docker, Docker Compose, Nginx, k6

---

## 4. Quick Start (Local Setup)

### Prerequisites
- Node.js >= 18.x
- MongoDB running locally or on Docker (`mongodb://localhost:27017`)
- Redis running locally or on Docker (`redis://localhost:6379`)

### 1. Clone & Configure
```bash
git clone https://github.com/your-org/recoverai.git
cd recoverai
cp .env.example server/.env
```

### 2. Run with Docker Compose (Recommended)
```bash
docker-compose up --build
```
- **Web App:** http://localhost:3000
- **API Server:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

### 3. Manual Local Run
```bash
# Terminal 1: Backend
cd server
npm install
npm run dev

# Terminal 2: BullMQ Workers
cd server
npm run worker

# Terminal 3: Frontend
cd client
npm install
npm run dev
```

---

## 5. Hackathon 3-Minute Judging Demo Flow

1. Open **http://localhost:3000** and click **1-Click Demo Login**.
2. On the **Dashboard**, view the initial state: **₹48.7L Revenue At Risk**.
3. Click the top banner button **"Run Winning Demo"** (or visit **Demo Simulator**).
4. Watch the live 8-step loop execute for **Rahul Sharma (₹4,999 UPI Timeout)**:
   - AI diagnoses failure with **87% confidence**.
   - Guardrail Policy approves bounded **CREATE_PAYMENT_LINK** action.
   - Payment Link generated via Razorpay Test Mode.
   - Webhook arrival automatically registers **₹4,999 RECOVERED**.
5. Click **"Ask RecoverAI"** in the top navbar and query: *"How much revenue did we recover?"*
6. Visit **Audit Trail** to inspect the complete immutable event sequence.

---

## 6. Architecture & Documentation Index

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — System design, data flow, queue pipeline
- [`API.md`](./API.md) — Complete REST endpoints & Webhook schemas
- [`AI.md`](./AI.md) — Agent design, prompts, tool calling, explainability, safety
- [`SECURITY.md`](./SECURITY.md) — Guardrails, RBAC, tenant isolation, encryption
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — Docker & AWS production infrastructure
- [`SCALING.md`](./SCALING.md) — 1M user architecture, BullMQ, Redis caching, k6 load tests
- [`DEMO.md`](./DEMO.md) — Step-by-step judge walkthrough & failure scenarios

---

## 7. Known Limitations & Future Work

1. **Live Razorpay Transactions:** Intentionally restricted to **TEST MODE** for hackathon safety.
2. **Voice Recovery Agent:** Architecture designed in `VoiceRecoveryAgent` interface; audio calling is scheduled for Phase 2.
3. **WhatsApp / SMS Delivery:** Defaults to `MockAdapter` unless merchant supplies Twilio / Meta credentials in Settings.
