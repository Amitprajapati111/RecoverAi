"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = void 0;
const mongoose_1 = require("mongoose");
const Payment_1 = require("../models/Payment");
const RecoveryCase_1 = require("../models/RecoveryCase");
const AiDecision_1 = require("../models/AiDecision");
const constants_1 = require("../config/constants");
exports.analyticsService = {
    /**
     * Get dashboard KPIs for a merchant
     */
    async getDashboardKPIs(merchantId, days = 30) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const mId = mongoose_1.Types.ObjectId.isValid(merchantId) ? new mongoose_1.Types.ObjectId(merchantId) : merchantId;
        const [paymentStats, atRiskStats, recoveredStats, aiDecisionCount, escalationCount,] = await Promise.all([
            // Total payments and failed
            Payment_1.Payment.aggregate([
                { $match: { merchantId: mId, createdAt: { $gte: since } } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' },
                    },
                },
            ]),
            // Revenue at risk (cases not yet recovered)
            RecoveryCase_1.RecoveryCase.aggregate([
                {
                    $match: {
                        merchantId: mId,
                        createdAt: { $gte: since },
                        status: {
                            $in: [
                                constants_1.RECOVERY_CASE_STATUS.NEW,
                                constants_1.RECOVERY_CASE_STATUS.ANALYZING,
                                constants_1.RECOVERY_CASE_STATUS.RECOVERABLE,
                                constants_1.RECOVERY_CASE_STATUS.IN_RECOVERY,
                                constants_1.RECOVERY_CASE_STATUS.ESCALATED,
                            ],
                        },
                    },
                },
                { $group: { _id: null, total: { $sum: '$amountAtRisk' }, count: { $sum: 1 } } },
            ]),
            // Recovered revenue
            RecoveryCase_1.RecoveryCase.aggregate([
                {
                    $match: {
                        merchantId: mId,
                        createdAt: { $gte: since },
                        status: constants_1.RECOVERY_CASE_STATUS.RECOVERED,
                    },
                },
                { $group: { _id: null, total: { $sum: '$recoveredAmount' }, count: { $sum: 1 } } },
            ]),
            // AI decisions count
            AiDecision_1.AiDecision.countDocuments({ merchantId: mId, createdAt: { $gte: since } }),
            // Escalations
            RecoveryCase_1.RecoveryCase.countDocuments({
                merchantId: mId,
                createdAt: { $gte: since },
                status: constants_1.RECOVERY_CASE_STATUS.ESCALATED,
            }),
        ]);
        const failedPayments = paymentStats.find((p) => p._id === constants_1.PAYMENT_STATUS.FAILED);
        const successPayments = paymentStats.find((p) => p._id === constants_1.PAYMENT_STATUS.CAPTURED);
        const revenueAtRisk = atRiskStats[0]?.total || 0;
        const recoveredRevenue = recoveredStats[0]?.total || 0;
        const atRiskCount = atRiskStats[0]?.count || 0;
        const recoveredCount = recoveredStats[0]?.count || 0;
        // Recovery rate
        const totalAttempted = atRiskCount + recoveredCount;
        const recoveryRate = totalAttempted > 0 ? (recoveredCount / totalAttempted) * 100 : 0;
        return {
            revenueAtRisk,
            recoverableRevenue: Math.floor(revenueAtRisk * 0.65), // Estimated
            recoveredRevenue,
            recoveryRate: parseFloat(recoveryRate.toFixed(1)),
            failedPayments: failedPayments?.count || 0,
            totalPayments: paymentStats.reduce((a, b) => a + b.count, 0),
            successfulPayments: successPayments?.count || 0,
            aiActions: aiDecisionCount,
            humanEscalations: escalationCount,
            periodDays: days,
        };
    },
    /**
     * Revenue recovery funnel
     */
    async getRecoveryFunnel(merchantId, days = 30) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const mId = mongoose_1.Types.ObjectId.isValid(merchantId) ? new mongoose_1.Types.ObjectId(merchantId) : merchantId;
        const [totalPayments, failed, analyzed, recoverable, attempted, recovered] = await Promise.all([
            Payment_1.Payment.countDocuments({ merchantId: mId, createdAt: { $gte: since } }),
            Payment_1.Payment.countDocuments({ merchantId: mId, createdAt: { $gte: since }, status: constants_1.PAYMENT_STATUS.FAILED }),
            RecoveryCase_1.RecoveryCase.countDocuments({ merchantId: mId, createdAt: { $gte: since }, status: { $ne: constants_1.RECOVERY_CASE_STATUS.NEW } }),
            RecoveryCase_1.RecoveryCase.countDocuments({
                merchantId: mId,
                createdAt: { $gte: since },
                status: { $in: [constants_1.RECOVERY_CASE_STATUS.RECOVERABLE, constants_1.RECOVERY_CASE_STATUS.IN_RECOVERY, constants_1.RECOVERY_CASE_STATUS.RECOVERED] },
            }),
            RecoveryCase_1.RecoveryCase.countDocuments({
                merchantId: mId,
                createdAt: { $gte: since },
                status: { $in: [constants_1.RECOVERY_CASE_STATUS.IN_RECOVERY, constants_1.RECOVERY_CASE_STATUS.RECOVERED] },
            }),
            RecoveryCase_1.RecoveryCase.countDocuments({ merchantId: mId, createdAt: { $gte: since }, status: constants_1.RECOVERY_CASE_STATUS.RECOVERED }),
        ]);
        return [
            { stage: 'Total Payments', count: totalPayments },
            { stage: 'Failed / At Risk', count: failed },
            { stage: 'AI Analyzed', count: analyzed },
            { stage: 'Recoverable', count: recoverable },
            { stage: 'Recovery Attempted', count: attempted },
            { stage: 'Recovered', count: recovered },
        ];
    },
    /**
     * Failure breakdown by type
     */
    async getFailureBreakdown(merchantId, days = 30) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const mId = mongoose_1.Types.ObjectId.isValid(merchantId) ? new mongoose_1.Types.ObjectId(merchantId) : merchantId;
        return Payment_1.Payment.aggregate([
            { $match: { merchantId: mId, createdAt: { $gte: since }, status: constants_1.PAYMENT_STATUS.FAILED } },
            {
                $group: {
                    _id: '$failureType',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                },
            },
            { $sort: { count: -1 } },
        ]);
    },
    /**
     * Recovery performance over time (daily)
     */
    async getRecoveryTrend(merchantId, days = 30) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const mId = mongoose_1.Types.ObjectId.isValid(merchantId) ? new mongoose_1.Types.ObjectId(merchantId) : merchantId;
        return RecoveryCase_1.RecoveryCase.aggregate([
            { $match: { merchantId: mId, createdAt: { $gte: since } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    atRisk: { $sum: '$amountAtRisk' },
                    recovered: {
                        $sum: {
                            $cond: [{ $eq: ['$status', constants_1.RECOVERY_CASE_STATUS.RECOVERED] }, '$recoveredAmount', 0],
                        },
                    },
                    cases: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
    },
};
//# sourceMappingURL=analytics.service.js.map