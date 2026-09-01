import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { QUEUE_NAMES } from '../config/constants';
import { recoveryService } from '../services/recovery.service';
import { logger } from '../utils/logger';

export function startRecoveryWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.RECOVERY,
    async (job) => {
      const { recoveryCaseId, action, delayMinutes } = job.data;
      logger.info(`RecoveryWorker: executing ${action} for case ${recoveryCaseId}`);
      await recoveryService.executeAction(recoveryCaseId, action, delayMinutes);
    },
    {
      connection: getRedisClient(),
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    logger.info(`RecoveryWorker: job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`RecoveryWorker: job ${job?.id} failed:`, err);
  });

  return worker;
}
