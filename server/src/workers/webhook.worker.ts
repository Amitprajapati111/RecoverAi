import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { QUEUE_NAMES } from '../config/constants';
import { processWebhookEvent } from '../controllers/webhook.controller';
import { logger } from '../utils/logger';

export function startWebhookWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.WEBHOOK,
    async (job) => {
      const { eventId, eventType } = job.data;
      logger.info(`WebhookWorker: processing job ${job.id} for event ${eventId}`);
      await processWebhookEvent(eventId, eventType);
    },
    {
      connection: getRedisClient(),
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    logger.info(`WebhookWorker: job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`WebhookWorker: job ${job?.id} failed with error:`, err);
  });

  return worker;
}
