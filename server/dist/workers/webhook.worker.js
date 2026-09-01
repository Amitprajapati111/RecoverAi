"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWebhookWorker = startWebhookWorker;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const constants_1 = require("../config/constants");
const webhook_controller_1 = require("../controllers/webhook.controller");
const logger_1 = require("../utils/logger");
function startWebhookWorker() {
    const worker = new bullmq_1.Worker(constants_1.QUEUE_NAMES.WEBHOOK, async (job) => {
        const { eventId, eventType } = job.data;
        logger_1.logger.info(`WebhookWorker: processing job ${job.id} for event ${eventId}`);
        await (0, webhook_controller_1.processWebhookEvent)(eventId, eventType);
    }, {
        connection: (0, redis_1.getRedisClient)(),
        concurrency: 5,
    });
    worker.on('completed', (job) => {
        logger_1.logger.info(`WebhookWorker: job ${job.id} completed successfully`);
    });
    worker.on('failed', (job, err) => {
        logger_1.logger.error(`WebhookWorker: job ${job?.id} failed with error:`, err);
    });
    return worker;
}
//# sourceMappingURL=webhook.worker.js.map