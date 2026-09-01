# REST API & Webhook Documentation — RecoverAI

Base URL: `http://localhost:5000/api`

## 1. Authentication (`/api/auth`)
- `POST /register` — Register merchant and owner account
- `POST /login` — Authenticate and receive JWT access token + refresh cookie
- `POST /refresh` — Refresh access token using httpOnly cookie
- `POST /logout` — Invalidate session
- `GET /me` — Get current user profile

## 2. Dashboard & System Health (`/api/dashboard`)
- `GET /` — Retrieve dashboard KPIs, recovery funnel, failure breakdown, and trend
- `GET /system-status` — Get queue health, database connectivity, and Razorpay mode
- `GET /health` — Public health check (`status`, `database`, `redis`, `razorpay`)
- `GET /ready` — Readiness probe

## 3. Revenue Recovery (`/api/recovery`)
- `GET /cases` — List recovery cases (filters: `status`, `priority`, `page`, `limit`)
- `GET /cases/:id` — Retrieve recovery case, AI decisions, and audit trail
- `POST /cases/:id/analyze` — Trigger on-demand AI analysis
- `POST /cases/:id/approve` — Human approval to execute high-value recovery action
- `POST /cases/:id/reject` — Reject and stop automated recovery
- `POST /cases/:id/stop` — Manually halt recovery sequence

## 4. AI Center (`/api/ai`)
- `GET /decisions` — List structured AI decision records
- `GET /decisions/:id` — Inspect decision JSON, context, and factors
- `GET /evaluations` — Precision, recall, and false positive metrics
- `POST /ask` — Safe "Ask RecoverAI" assistant with internal tool calling

## 5. Webhooks (`/api/webhooks`)
- `POST /razorpay` — Public webhook receiver; validates signature, checks idempotency, enqueues to BullMQ
- `GET /events` — View webhook logs

## 6. Demo Simulator (`/api/simulator`)
- `POST /winning-demo` — Run the 1-click ₹4,999 recovery showcase
- `POST /run` — Generate 100 / 1,000 / 10,000 synthetic transactions
- `POST /clear` — Clear simulated data
