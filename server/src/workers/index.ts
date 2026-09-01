import { connectDatabase } from '../config/database';
import { connectRedis } from '../config/redis';
import { startWebhookWorker } from './webhook.worker';
import { startAIAnalysisWorker } from './aiAnalysis.worker';
import { startRecoveryWorker } from './recovery.worker';
import { logger } from '../utils/logger';

async function startWorkers() {
  try {
    logger.info('🚀 Starting RecoverAI Background Workers...');
    await connectDatabase();
    await connectRedis();

    const webhookWorker = startWebhookWorker();
    const aiWorker = startAIAnalysisWorker();
    const recoveryWorker = startRecoveryWorker();

    logger.info('✅ All BullMQ background workers initialized and listening to queues');

    const shutdown = async () => {
      logger.info('Shutting down workers gracefully...');
      await Promise.all([
        webhookWorker.close(),
        aiWorker.close(),
        recoveryWorker.close(),
      ]);
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start workers:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startWorkers();
}
