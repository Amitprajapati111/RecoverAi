# Deployment & Infrastructure Guide — RecoverAI

## 1. Production Architecture (AWS)

```
AWS Cloud
 ├── CloudFront (Global CDN for static assets)
 ├── Application Load Balancer (ALB with TLS termination)
 ├── ECS Fargate / EC2 (Dockerized Node.js API instances)
 ├── ECS Fargate (BullMQ Worker instances: Webhook, AI, Recovery)
 ├── Amazon ElastiCache for Redis (Queue coordination & caching)
 ├── MongoDB Atlas (Managed primary document store with replica sets)
 ├── AWS Secrets Manager (Encrypted credential storage)
 └── CloudWatch (Centralized logs, latency alarms, queue metrics)
```

## 2. Docker Deployment

To launch all services locally or on an EC2 instance:
```bash
docker-compose up --build -d
```

Services started:
- `recoverai_frontend` on port 3000
- `recoverai_api` on port 5000
- `recoverai_worker` (background BullMQ workers)
- `recoverai_mongodb` on port 27017
- `recoverai_redis` on port 6379
