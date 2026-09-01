"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAIAnalysisWorker = startAIAnalysisWorker;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const constants_1 = require("../config/constants");
const recovery_service_1 = require("../services/recovery.service");
const logger_1 = require("../utils/logger");
function startAIAnalysisWorker() {
    const worker = new bullmq_1.Worker(constants_1.QUEUE_NAMES.AI_ANALYSIS, async (job) => {
        const { recoveryCaseId } = job.data;
        logger_1.logger.info(`AIAnalysisWorker: analyzing recovery case ${recoveryCaseId}`);
        await recovery_service_1.recoveryService.analyzeWithAI(recoveryCaseId);
    }, {
        connection: (0, redis_1.getRedisClient)(),
        concurrency: 3,
    });
    worker.on('completed', (job) => {
        logger_1.logger.info(`AIAnalysisWorker: job ${job.id} finished`);
    });
    worker.on('failed', (job, err) => {
        logger_1.logger.error(`AIAnalysisWorker: job ${job?.id} failed:`, err);
    });
    return worker;
}
//# sourceMappingURL=aiAnalysis.worker.js.map