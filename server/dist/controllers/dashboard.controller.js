"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemStatus = exports.getDashboard = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiResponse_1 = require("../utils/apiResponse");
const analytics_service_1 = require("../services/analytics.service");
const queues_1 = require("../queues/queues");
const razorpayClient_1 = require("../integrations/razorpay/razorpayClient");
const env_1 = require("../config/env");
const redis_1 = require("../config/redis");
exports.getDashboard = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const days = parseInt(req.query.days) || 30;
    const cacheKey = `recoverai:dashboard:${merchantId}:${days}`;
    try {
        const cachedData = await redis_1.cache.get(cacheKey);
        if (cachedData) {
            return (0, apiResponse_1.sendSuccess)(res, cachedData);
        }
    }
    catch {
        // Gracefully continue to database query if Redis read fails
    }
    const [kpis, funnel, failureBreakdown, trend] = await Promise.all([
        analytics_service_1.analyticsService.getDashboardKPIs(merchantId, days),
        analytics_service_1.analyticsService.getRecoveryFunnel(merchantId, days),
        analytics_service_1.analyticsService.getFailureBreakdown(merchantId, days),
        analytics_service_1.analyticsService.getRecoveryTrend(merchantId, days),
    ]);
    const dashboardData = { kpis, funnel, failureBreakdown, trend };
    try {
        await redis_1.cache.set(cacheKey, dashboardData, 30); // 30s TTL
    }
    catch {
        // Gracefully handle if Redis set fails
    }
    (0, apiResponse_1.sendSuccess)(res, dashboardData);
});
exports.getSystemStatus = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const queueStats = await (0, queues_1.getQueueStats)();
    (0, apiResponse_1.sendSuccess)(res, {
        razorpay: {
            configured: (0, razorpayClient_1.isRazorpayConfigured)(),
            environment: (0, razorpayClient_1.getRazorpayEnvironment)(),
        },
        ai: {
            provider: env_1.env.AI_PROVIDER,
            configured: env_1.env.AI_PROVIDER === 'mock' || Boolean(env_1.env.AI_API_KEY),
        },
        queues: queueStats,
    });
});
//# sourceMappingURL=dashboard.controller.js.map