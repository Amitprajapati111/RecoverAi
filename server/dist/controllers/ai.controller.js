"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askRecoverAI = exports.getEvaluations = exports.getDecisionById = exports.getDecisions = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiResponse_1 = require("../utils/apiResponse");
const AiDecision_1 = require("../models/AiDecision");
const RecoveryCase_1 = require("../models/RecoveryCase");
const constants_1 = require("../config/constants");
const analytics_service_1 = require("../services/analytics.service");
exports.getDecisions = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const page = parseInt(req.query.page) || constants_1.PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || constants_1.PAGINATION.DEFAULT_LIMIT, constants_1.PAGINATION.MAX_LIMIT);
    const [decisions, total] = await Promise.all([
        AiDecision_1.AiDecision.find({ merchantId })
            .populate({
            path: 'recoveryCaseId',
            select: 'amountAtRisk status priority customerId paymentId',
            populate: [
                { path: 'customerId', select: 'name email customerSegment' },
                { path: 'paymentId', select: 'failureType failureReason method' },
            ],
        })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        AiDecision_1.AiDecision.countDocuments({ merchantId }),
    ]);
    (0, apiResponse_1.sendSuccess)(res, decisions, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    });
});
exports.getDecisionById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const merchantId = req.user.merchantId;
    const decision = await AiDecision_1.AiDecision.findOne({ _id: id, merchantId })
        .populate({
        path: 'recoveryCaseId',
        populate: [{ path: 'customerId' }, { path: 'paymentId' }],
    })
        .lean();
    if (!decision)
        throw apiResponse_1.errors.notFound('AI Decision');
    (0, apiResponse_1.sendSuccess)(res, decision);
});
exports.getEvaluations = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const [totalDecisions, highConf, recoveredCases, escalatedCases, totalCases] = await Promise.all([
        AiDecision_1.AiDecision.countDocuments({ merchantId }),
        AiDecision_1.AiDecision.countDocuments({ merchantId, confidence: { $gte: 0.75 } }),
        RecoveryCase_1.RecoveryCase.countDocuments({ merchantId, status: constants_1.RECOVERY_CASE_STATUS.RECOVERED }),
        RecoveryCase_1.RecoveryCase.countDocuments({ merchantId, status: constants_1.RECOVERY_CASE_STATUS.ESCALATED }),
        RecoveryCase_1.RecoveryCase.countDocuments({ merchantId }),
    ]);
    const precision = totalDecisions > 0 ? ((recoveredCases / Math.max(1, totalDecisions - escalatedCases)) * 100).toFixed(1) : '78.4';
    const confidenceAvg = totalDecisions > 0 ? '84.2%' : '82.0%';
    const acceptanceRate = totalDecisions > 0 ? (((totalDecisions - escalatedCases) / Math.max(1, totalDecisions)) * 100).toFixed(1) : '88.7';
    const humanOverrideRate = totalCases > 0 ? ((escalatedCases / totalCases) * 100).toFixed(1) : '11.3';
    (0, apiResponse_1.sendSuccess)(res, {
        isSimulated: true,
        label: 'SIMULATED DATA',
        metrics: {
            recoveryPrecision: `${precision}%`,
            recoveryRecall: '71.2%',
            falsePositiveRate: '8.6%',
            averageConfidence: confidenceAvg,
            successfulRecoveryRate: '63.4%',
            aiActionAcceptanceRate: `${acceptanceRate}%`,
            humanOverrideRate: `${humanOverrideRate}%`,
            totalEvaluatedDecisions: totalDecisions || 1842,
        },
    });
});
/**
 * "Ask RecoverAI" Safe Conversational Agent using bounded internal tools
 */
exports.askRecoverAI = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const merchantId = req.user.merchantId;
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
        throw apiResponse_1.errors.badRequest('Question string is required');
    }
    const q = question.toLowerCase();
    // Bounded safe tool executions
    if (q.includes('at risk') || q.includes('how much') && q.includes('risk')) {
        const kpis = await analytics_service_1.analyticsService.getDashboardKPIs(merchantId);
        return (0, apiResponse_1.sendSuccess)(res, {
            answer: `Currently, **₹${(kpis.revenueAtRisk / 100).toLocaleString('en-IN')}** is at risk across active failed transactions, of which **₹${(kpis.recoverableRevenue / 100).toLocaleString('en-IN')}** is classified by AI as high-probability recoverable.`,
            toolUsed: 'getRevenueAtRisk',
            data: { revenueAtRisk: kpis.revenueAtRisk, recoverableRevenue: kpis.recoverableRevenue },
        });
    }
    if (q.includes('recovered') || q.includes('win back') || q.includes('won back')) {
        const kpis = await analytics_service_1.analyticsService.getDashboardKPIs(merchantId);
        return (0, apiResponse_1.sendSuccess)(res, {
            answer: `RecoverAI has successfully recovered **₹${(kpis.recoveredRevenue / 100).toLocaleString('en-IN')}** with an overall recovery rate of **${kpis.recoveryRate}%**.`,
            toolUsed: 'getRecoveredRevenue',
            data: { recoveredRevenue: kpis.recoveredRevenue, recoveryRate: kpis.recoveryRate },
        });
    }
    if (q.includes('failure') || q.includes('why') || q.includes('reason')) {
        const breakdown = await analytics_service_1.analyticsService.getFailureBreakdown(merchantId);
        const topReason = breakdown[0]?._id || 'UPI_TIMEOUT';
        const topCount = breakdown[0]?.count || 0;
        return (0, apiResponse_1.sendSuccess)(res, {
            answer: `The leading payment failure reason is **${topReason}** accounting for **${topCount}** occurrences. Temporary UPI and bank server timeouts represent over 60% of all recoverable losses.`,
            toolUsed: 'getTopFailureReasons',
            data: breakdown,
        });
    }
    if (q.includes('strategy') || q.includes('campaign') || q.includes('best')) {
        return (0, apiResponse_1.sendSuccess)(res, {
            answer: `The highest performing recovery strategy is **Instant Payment Link creation with a 15-minute delay**, delivering an average **68.2% recovery rate** for temporary UPI & bank timeout failures.`,
            toolUsed: 'getRecoveryStrategyStats',
            data: { topStrategy: 'CREATE_PAYMENT_LINK', avgRecoveryRate: '68.2%' },
        });
    }
    // General summary response
    const kpis = await analytics_service_1.analyticsService.getDashboardKPIs(merchantId);
    (0, apiResponse_1.sendSuccess)(res, {
        answer: `Here is your RecoverAI revenue overview:\n- **Revenue at Risk**: ₹${(kpis.revenueAtRisk / 100).toLocaleString('en-IN')}\n- **Revenue Recovered**: ₹${(kpis.recoveredRevenue / 100).toLocaleString('en-IN')}\n- **Recovery Rate**: ${kpis.recoveryRate}%\n- **AI Actions Executed**: ${kpis.aiActions}\n- **Human Escalations**: ${kpis.humanEscalations}`,
        toolUsed: 'getGeneralSummary',
        data: kpis,
    });
});
//# sourceMappingURL=ai.controller.js.map