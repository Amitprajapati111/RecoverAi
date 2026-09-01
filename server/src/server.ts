import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';
import { startAIAnalysisWorker } from './workers/aiAnalysis.worker';
import { startWebhookWorker } from './workers/webhook.worker';
import { startRecoveryWorker } from './workers/recovery.worker';

async function bootstrap() {
  try {
    logger.info('Initializing RecoverAI server components...');

    await connectDatabase();

    try {
      await connectRedis();
    } catch (redisErr) {
      logger.warn('Redis connection failed initially. App will continue with in-memory fallbacks where possible.');
    }

    const app = createApp();
    const port = parseInt(env.PORT, 10) || 5000;

    const server = app.listen(port, () => {
      logger.info(`🚀 RecoverAI API Server running on port ${port} in ${env.NODE_ENV} mode`);
      logger.info(`👉 Health check: http://localhost:${port}/health`);
      logger.info(`👉 API Base: http://localhost:${port}/api`);
    });
  // Start background workers
  startAIAnalysisWorker();
  startWebhookWorker();
  startRecoveryWorker();
    const gracefulShutdown = async () => {
      logger.info('Shutting down RecoverAI server gracefully...');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    logger.error('Fatal error during startup:', error);
    process.exit(1);
  }
}

bootstrap();
