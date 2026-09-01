"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const logger_1 = require("./utils/logger");
const aiAnalysis_worker_1 = require("./workers/aiAnalysis.worker");
const webhook_worker_1 = require("./workers/webhook.worker");
const recovery_worker_1 = require("./workers/recovery.worker");
async function bootstrap() {
    try {
        logger_1.logger.info('Initializing RecoverAI server components...');
        await (0, database_1.connectDatabase)();
        try {
            await (0, redis_1.connectRedis)();
        }
        catch (redisErr) {
            logger_1.logger.warn('Redis connection failed initially. App will continue with in-memory fallbacks where possible.');
        }
        const app = (0, app_1.createApp)();
        const port = parseInt(env_1.env.PORT, 10) || 5000;
        const server = app.listen(port, () => {
            logger_1.logger.info(`🚀 RecoverAI API Server running on port ${port} in ${env_1.env.NODE_ENV} mode`);
            logger_1.logger.info(`👉 Health check: http://localhost:${port}/health`);
            logger_1.logger.info(`👉 API Base: http://localhost:${port}/api`);
        });
        // Start background workers
        (0, aiAnalysis_worker_1.startAIAnalysisWorker)();
        (0, webhook_worker_1.startWebhookWorker)();
        (0, recovery_worker_1.startRecoveryWorker)();
        const gracefulShutdown = async () => {
            logger_1.logger.info('Shutting down RecoverAI server gracefully...');
            server.close(() => {
                logger_1.logger.info('HTTP server closed');
                process.exit(0);
            });
        };
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
    }
    catch (error) {
        logger_1.logger.error('Fatal error during startup:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=server.js.map