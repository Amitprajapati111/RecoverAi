import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { QUEUE_NAMES } from '../config/constants';
import { recoveryService } from '../services/recovery.service';
import { logger } from '../utils/logger';

export function startAIAnalysisWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.AI_ANALYSIS,
    async (job) => {
      const { recoveryCaseId } = job.data;
      logger.info(`AIAnalysisWorker: analyzing recovery case ${recoveryCaseId}`);
      await recoveryService.analyzeWithAI(recoveryCaseId);
    },
    {
      connection: getRedisClient(),
      concurrency: 3,
    }
  );

  worker.on('completed', (job) => {
    logger.info(`AIAnalysisWorker: job ${job.id} finished`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`AIAnalysisWorker: job ${job?.id} failed:`, err);
  });

  return worker;
}
