"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsQueue = exports.notificationQueue = exports.recoveryQueue = exports.aiAnalysisQueue = exports.webhookQueue = void 0;
exports.enqueueWebhookJob = enqueueWebhookJob;
exports.enqueueAIAnalysis = enqueueAIAnalysis;
exports.enqueueRecoveryAction = enqueueRecoveryAction;
exports.getQueueStats = getQueueStats;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const constants_1 = require("../config/constants");
const logger_1 = require("../utils/logger");
const defaultJobOptions = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
};
const connection = { connection: (0, redis_1.getRedisClient)() };
exports.webhookQueue = new bullmq_1.Queue(constants_1.QUEUE_NAMES.WEBHOOK, {
    ...connection,
    defaultJobOptions,
});
exports.aiAnalysisQueue = new bullmq_1.Queue(constants_1.QUEUE_NAMES.AI_ANALYSIS, {
    ...connection,
    defaultJobOptions: { ...defaultJobOptions, attempts: 2 },
});
exports.recoveryQueue = new bullmq_1.Queue(constants_1.QUEUE_NAMES.RECOVERY, {
    ...connection,
    defaultJobOptions,
});
exports.notificationQueue = new bullmq_1.Queue(constants_1.QUEUE_NAMES.NOTIFICATION, {
    ...connection,
    defaultJobOptions,
});
exports.analyticsQueue = new bullmq_1.Queue(constants_1.QUEUE_NAMES.ANALYTICS, {
    ...connection,
    defaultJobOptions: { ...defaultJobOptions, attempts: 1 },
});
// Helper to add jobs with logging
async function enqueueWebhookJob(data) {
    await exports.webhookQueue.add('process-webhook', data, {
        jobId: `webhook-${data.eventId}`, // Idempotency via jobId
    });
    logger_1.logger.info(`Enqueued webhook job: ${data.eventId}`);
}
async function enqueueAIAnalysis(data) {
    await exports.aiAnalysisQueue.add('analyze-recovery', data, {
        priority: data.priority || 5,
    });
    logger_1.logger.info(`Enqueued AI analysis: ${data.recoveryCaseId}`);
}
async function enqueueRecoveryAction(data) {
    const delay = data.delayMinutes ? data.delayMinutes * 60 * 1000 : 0;
    await exports.recoveryQueue.add('execute-recovery', data, { delay });
    logger_1.logger.info(`Enqueued recovery action: ${data.action} for case ${data.recoveryCaseId}`);
}
async function getQueueStats() {
    const [webhookCounts, aiCounts, recoveryCounts, notifCounts] = await Promise.all([
        exports.webhookQueue.getJobCounts(),
        exports.aiAnalysisQueue.getJobCounts(),
        exports.recoveryQueue.getJobCounts(),
        exports.notificationQueue.getJobCounts(),
    ]);
    return {
        webhook: webhookCounts,
        aiAnalysis: aiCounts,
        recovery: recoveryCounts,
        notification: notifCounts,
    };
}
//# sourceMappingURL=queues.js.map