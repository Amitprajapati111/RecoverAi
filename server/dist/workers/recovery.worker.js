"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRecoveryWorker = startRecoveryWorker;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const constants_1 = require("../config/constants");
const recovery_service_1 = require("../services/recovery.service");
const logger_1 = require("../utils/logger");
function startRecoveryWorker() {
    const worker = new bullmq_1.Worker(constants_1.QUEUE_NAMES.RECOVERY, async (job) => {
        const { recoveryCaseId, action, delayMinutes } = job.data;
        logger_1.logger.info(`RecoveryWorker: executing ${action} for case ${recoveryCaseId}`);
        await recovery_service_1.recoveryService.executeAction(recoveryCaseId, action, delayMinutes);
    }, {
        connection: (0, redis_1.getRedisClient)(),
        concurrency: 5,
    });
    worker.on('completed', (job) => {
        logger_1.logger.info(`RecoveryWorker: job ${job.id} completed`);
    });
    worker.on('failed', (job, err) => {
        logger_1.logger.error(`RecoveryWorker: job ${job?.id} failed:`, err);
    });
    return worker;
}
//# sourceMappingURL=recovery.worker.js.map