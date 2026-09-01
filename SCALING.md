# Scalability Architecture & Load Testing — RecoverAI

## 1. Designing for 100K+ Merchants & High Webhook Traffic

RecoverAI uses a stateless API design backed by distributed caching and async queues:

1. **Stateless API Layer:** API servers do not hold in-memory session states. Multiple API containers run horizontally behind an Application Load Balancer.
2. **Dedicated Worker Scaling:** BullMQ workers scale independently from API nodes:
   - Webhook Workers: Scale horizontally based on queue depth during flash sales.
   - AI Workers: Concurrency-controlled to respect LLM rate limits.
   - Recovery Workers: Handle scheduled payment link dispatches with exponential backoff.
3. **Database Indexing:** Compound indexes on `merchantId`, `status`, `customerId`, and unique indexes on `eventId` for webhook idempotency.

## 2. Load Testing with k6

Run the included k6 test script to benchmark throughput and latency:

```bash
k6 run load-test.js
```

### Measured Benchmark Targets:
- **Throughput:** 100 → 500 → 1,000 rps
- **p95 Latency:** < 200ms
- **p99 Latency:** < 500ms
- **Error Rate:** < 0.01%
