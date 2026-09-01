import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { QUEUE_NAMES } from '../config/constants';
import { logger } from '../utils/logger';

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
};

const connection = { connection: getRedisClient() };

export const webhookQueue = new Queue(QUEUE_NAMES.WEBHOOK, {
  ...connection,
  defaultJobOptions,
});

export const aiAnalysisQueue = new Queue(QUEUE_NAMES.AI_ANALYSIS, {
  ...connection,
  defaultJobOptions: { ...defaultJobOptions, attempts: 2 },
});

export const recoveryQueue = new Queue(QUEUE_NAMES.RECOVERY, {
  ...connection,
  defaultJobOptions,
});

export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, {
  ...connection,
  defaultJobOptions,
});

export const analyticsQueue = new Queue(QUEUE_NAMES.ANALYTICS, {
  ...connection,
  defaultJobOptions: { ...defaultJobOptions, attempts: 1 },
});

// Helper to add jobs with logging
export async function enqueueWebhookJob(data: {
  eventId: string;
  eventType: string;
  merchantId?: string;
}): Promise<void> {
  await webhookQueue.add('process-webhook', data, {
    jobId: `webhook-${data.eventId}`, // Idempotency via jobId
  });
  logger.info(`Enqueued webhook job: ${data.eventId}`);
}

export async function enqueueAIAnalysis(data: {
  recoveryCaseId: string;
  merchantId: string;
  priority?: number;
}): Promise<void> {
  await aiAnalysisQueue.add('analyze-recovery', data, {
    priority: data.priority || 5,
  });
  logger.info(`Enqueued AI analysis: ${data.recoveryCaseId}`);
}

export async function enqueueRecoveryAction(data: {
  recoveryCaseId: string;
  merchantId: string;
  action: string;
  delayMinutes?: number;
}): Promise<void> {
  const delay = data.delayMinutes ? data.delayMinutes * 60 * 1000 : 0;
  await recoveryQueue.add('execute-recovery', data, { delay });
  logger.info(`Enqueued recovery action: ${data.action} for case ${data.recoveryCaseId}`);
}

export async function getQueueStats() {
  const [webhookCounts, aiCounts, recoveryCounts, notifCounts] = await Promise.all([
    webhookQueue.getJobCounts(),
    aiAnalysisQueue.getJobCounts(),
    recoveryQueue.getJobCounts(),
    notificationQueue.getJobCounts(),
  ]);

  return {
    webhook: webhookCounts,
    aiAnalysis: aiCounts,
    recovery: recoveryCounts,
    notification: notifCounts,
  };
}
