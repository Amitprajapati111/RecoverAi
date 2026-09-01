# Hackathon Judging & Demo Guide — RecoverAI

## 30-Second Elevator Pitch
> *"RecoverAI is an AI Revenue Recovery Orchestrator for Razorpay merchants. It detects revenue slipping away from failed payments, diagnoses root causes with AI, enforces strict merchant guardrails, and closes the recovery loop through automated Razorpay Payment Links and webhook verification."*

---

## 3-Minute Live Demo Script

### Scene 1: The Problem (Dashboard Overview)
1. Open `http://localhost:3000` → click **"1-Click Demo Login"**.
2. Show the KPI header:
   - **Revenue At Risk:** ₹48.7L
   - **Recovered Revenue:** ₹19.8L
   - **Recovery Rate:** 63.4%
3. Point out the **Revenue Recovery Funnel** showing conversion drop-offs.

### Scene 2: The 1-Click "Winning Demo" Scenario
1. Navigate to **Demo Simulator** (or click **"Run Winning Demo"** in the top navbar).
2. Click **"Run Winning Demo"**.
3. Watch the live execution card update for **Rahul Sharma (₹4,999 UPI Timeout)**:
   - Step 1: `payment.failed` event ingested.
   - Step 2: AI diagnosis predicts **87% recovery probability** due to 8/9 prior successful payments.
   - Step 3: Guardrail policy validates transaction is under ₹10,000 limit → **APPROVED**.
   - Step 4: Razorpay Payment Link generated.
   - Step 5: Webhook confirms settlement → **₹4,999 RECOVERED**.

### Scene 3: AI Explainability & Human Approvals
1. Visit **AI Decision Center** to show the structured JSON decision, latency, and bulleted **Decision Factors**.
2. Visit **Approvals Queue** to show how high-value transactions (&gt; ₹10,000) are safely held for one-click human approval.

### Scene 4: "Ask RecoverAI" Revenue Assistant
1. Click **"Ask RecoverAI"** in the navbar.
2. Ask: *"How much revenue did we recover?"*
3. The AI executes the safe `getRecoveredRevenue` tool and provides immediate metrics.

### Scene 5: Immutable Audit Trail
1. Visit **Audit Trail** to show the tamper-evident log containing actor-tagged records (`AI`, `SYSTEM`, `USER`, `RAZORPAY`).
