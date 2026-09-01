"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const webhook_worker_1 = require("./webhook.worker");
const aiAnalysis_worker_1 = require("./aiAnalysis.worker");
const recovery_worker_1 = require("./recovery.worker");
const logger_1 = require("../utils/logger");
async function startWorkers() {
    try {
        logger_1.logger.info('🚀 Starting RecoverAI Background Workers...');
        await (0, database_1.connectDatabase)();
        await (0, redis_1.connectRedis)();
        const webhookWorker = (0, webhook_worker_1.startWebhookWorker)();
        const aiWorker = (0, aiAnalysis_worker_1.startAIAnalysisWorker)();
        const recoveryWorker = (0, recovery_worker_1.startRecoveryWorker)();
        logger_1.logger.info('✅ All BullMQ background workers initialized and listening to queues');
        const shutdown = async () => {
            logger_1.logger.info('Shutting down workers gracefully...');
            await Promise.all([
                webhookWorker.close(),
                aiWorker.close(),
                recoveryWorker.close(),
            ]);
            process.exit(0);
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }
    catch (error) {
        logger_1.logger.error('Failed to start workers:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    startWorkers();
}
//# sourceMappingURL=index.js.map