"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFullAnalytics = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiResponse_1 = require("../utils/apiResponse");
const analytics_service_1 = require("../services/analytics.service");
exports.getFullAnalytics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const days = parseInt(req.query.days) || 30;
    const [kpis, funnel, failureBreakdown, trend] = await Promise.all([
        analytics_service_1.analyticsService.getDashboardKPIs(merchantId, days),
        analytics_service_1.analyticsService.getRecoveryFunnel(merchantId, days),
        analytics_service_1.analyticsService.getFailureBreakdown(merchantId, days),
        analytics_service_1.analyticsService.getRecoveryTrend(merchantId, days),
    ]);
    // A/B Strategy Comparison
    const strategyComparison = [
        {
            strategy: 'Strategy A: Instant Payment Link (15 min delay)',
            recoveryRate: 64.2,
            avgRecoveryTime: '24 min',
            customerResponseRate: 78.5,
            revenueRecovered: 124500000,
            attempts: 420,
        },
        {
            strategy: 'Strategy B: Email Reminder + Method Update (30 min delay)',
            recoveryRate: 49.8,
            avgRecoveryTime: '1h 12m',
            customerResponseRate: 58.2,
            revenueRecovered: 68200000,
            attempts: 310,
        },
    ];
    (0, apiResponse_1.sendSuccess)(res, {
        kpis,
        funnel,
        failureBreakdown,
        trend,
        strategyComparison,
    });
});
//# sourceMappingURL=analytics.controller.js.map