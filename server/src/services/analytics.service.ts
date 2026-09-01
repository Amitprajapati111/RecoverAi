import { Types } from 'mongoose';
import { Payment } from '../models/Payment';
import { RecoveryCase } from '../models/RecoveryCase';
import { Customer } from '../models/Customer';
import { AiDecision } from '../models/AiDecision';
import { PAYMENT_STATUS, RECOVERY_CASE_STATUS } from '../config/constants';

export const analyticsService = {
  /**
   * Get dashboard KPIs for a merchant
   */
  async getDashboardKPIs(merchantId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const previousSince = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000);
    const mId = Types.ObjectId.isValid(merchantId) ? new Types.ObjectId(merchantId) : merchantId;

    // Debug logging
    console.log('[Analytics] Dashboard KPIs query:', {
      merchantId,
      mId: mId.toString(),
      since,
      previousSince,
      days,
    });

    const [
      paymentStats,
      atRiskStats,
      recoveredStats,
      aiDecisionCount,
      escalationCount,
      previousAtRiskStats,
      previousRecoveredStats,
      recoveryTimeStats,
      aiEvaluationStats,
    ] = await Promise.all([
      // Total payments and failed
      Payment.aggregate([
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
      RecoveryCase.aggregate([
        {
          $match: {
            merchantId: mId,
            createdAt: { $gte: since },
            status: {
              $in: [
                RECOVERY_CASE_STATUS.NEW,
                RECOVERY_CASE_STATUS.ANALYZING,
                RECOVERY_CASE_STATUS.RECOVERABLE,
                RECOVERY_CASE_STATUS.IN_RECOVERY,
                RECOVERY_CASE_STATUS.ESCALATED,
              ],
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$amountAtRisk' }, count: { $sum: 1 } } },
      ]),

      // Recovered revenue
      RecoveryCase.aggregate([
        {
          $match: {
            merchantId: mId,
            createdAt: { $gte: since },
            status: RECOVERY_CASE_STATUS.RECOVERED,
          },
        },
        { $group: { _id: null, total: { $sum: '$recoveredAmount' }, count: { $sum: 1 } } },
      ]),

      // AI decisions count
      AiDecision.countDocuments({ merchantId: mId, createdAt: { $gte: since } }),

      // Escalations
      RecoveryCase.countDocuments({
        merchantId: mId,
        createdAt: { $gte: since },
        status: RECOVERY_CASE_STATUS.ESCALATED,
      }),

      // Previous period revenue at risk
      RecoveryCase.aggregate([
        {
          $match: {
            merchantId: mId,
            createdAt: { $gte: previousSince, $lt: since },
            status: {
              $in: [
                RECOVERY_CASE_STATUS.NEW,
                RECOVERY_CASE_STATUS.ANALYZING,
                RECOVERY_CASE_STATUS.RECOVERABLE,
                RECOVERY_CASE_STATUS.IN_RECOVERY,
                RECOVERY_CASE_STATUS.ESCALATED,
              ],
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$amountAtRisk' } } },
      ]),

      // Previous period recovered revenue
      RecoveryCase.aggregate([
        {
          $match: {
            merchantId: mId,
            createdAt: { $gte: previousSince, $lt: since },
            status: RECOVERY_CASE_STATUS.RECOVERED,
          },
        },
        { $group: { _id: null, total: { $sum: '$recoveredAmount' } } },
      ]),

      // Average recovery time
      RecoveryCase.aggregate([
        {
          $match: {
            merchantId: mId,
            createdAt: { $gte: since },
            status: RECOVERY_CASE_STATUS.RECOVERED,
            recoveredAt: { $exists: true },
          },
        },
        {
          $project: {
            recoveryTimeMs: { $subtract: ['$recoveredAt', '$createdAt'] },
          },
        },
        {
          $group: {
            _id: null,
            avgRecoveryTimeMs: { $avg: '$recoveryTimeMs' },
          },
        },
      ]),

      // AI evaluation metrics
      RecoveryCase.aggregate([
        {
          $match: {
            merchantId: mId,
            createdAt: { $gte: since },
          },
        },
        {
          $lookup: {
            from: 'aidecisions',
            localField: 'aiDecisionId',
            foreignField: '_id',
            as: 'aiDecision',
          },
        },
        {
          $unwind: {
            path: '$aiDecision',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: null,
            totalCases: { $sum: 1 },
            truePositives: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', RECOVERY_CASE_STATUS.RECOVERED] },
                      { $eq: ['$aiDecision.decision.recoverable', true] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            falsePositives: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$status', RECOVERY_CASE_STATUS.RECOVERED] },
                      { $eq: ['$aiDecision.decision.recoverable', true] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            actualRecoverable: {
              $sum: {
                $cond: [
                  { $eq: ['$status', RECOVERY_CASE_STATUS.RECOVERED] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const failedPayments = paymentStats.find((p) => p._id === PAYMENT_STATUS.FAILED);
    const successPayments = paymentStats.find((p) => p._id === PAYMENT_STATUS.CAPTURED);

    // Debug logging
    console.log('[Analytics] Query results:', {
      paymentStats,
      atRiskStats,
      recoveredStats,
      aiDecisionCount,
      escalationCount,
      failedPayments,
      successPayments,
    });

    const revenueAtRisk = atRiskStats[0]?.total || 0;
    const recoveredRevenue = recoveredStats[0]?.total || 0;
    const atRiskCount = atRiskStats[0]?.count || 0;
    const recoveredCount = recoveredStats[0]?.count || 0;

    const previousRevenueAtRisk = previousAtRiskStats[0]?.total || 0;
    const previousRecoveredRevenue = previousRecoveredStats[0]?.total || 0;

    // Period-over-period changes
    const revenueAtRiskChange = previousRevenueAtRisk > 0 
      ? ((revenueAtRisk - previousRevenueAtRisk) / previousRevenueAtRisk) * 100 
      : 0;
    const recoveredRevenueChange = previousRecoveredRevenue > 0 
      ? ((recoveredRevenue - previousRecoveredRevenue) / previousRecoveredRevenue) * 100 
      : 0;

    // Recovery rate
    const totalAttempted = atRiskCount + recoveredCount;
    const recoveryRate = totalAttempted > 0 ? (recoveredCount / totalAttempted) * 100 : 0;

    // Average recovery time
    const avgRecoveryTimeMs = recoveryTimeStats[0]?.avgRecoveryTimeMs || 0;
    const avgRecoveryTimeMinutes = avgRecoveryTimeMs > 0 ? Math.round(avgRecoveryTimeMs / (1000 * 60)) : 0;
    const avgRecoveryTimeHours = Math.floor(avgRecoveryTimeMinutes / 60);
    const avgRecoveryTimeMins = avgRecoveryTimeMinutes % 60;

    // AI evaluation metrics
    const totalCases = aiEvaluationStats[0]?.totalCases || 0;
    const truePositives = aiEvaluationStats[0]?.truePositives || 0;
    const falsePositives = aiEvaluationStats[0]?.falsePositives || 0;
    const actualRecoverable = aiEvaluationStats[0]?.actualRecoverable || 0;

    const precision = totalCases > 0 ? (truePositives / totalCases) * 100 : 0;
    const recall = actualRecoverable > 0 ? (truePositives / actualRecoverable) * 100 : 0;
    const falsePositiveRate = totalCases > 0 ? (falsePositives / totalCases) * 100 : 0;

    return {
      revenueAtRisk,
      recoverableRevenue: Math.floor(revenueAtRisk * 0.65),
      recoveredRevenue,
      recoveryRate: parseFloat(recoveryRate.toFixed(1)),
      failedPayments: failedPayments?.count || 0,
      totalPayments: paymentStats.reduce((a, b) => a + b.count, 0),
      successfulPayments: successPayments?.count || 0,
      aiActions: aiDecisionCount,
      humanEscalations: escalationCount,
      periodDays: days,
      // Period-over-period comparisons
      revenueAtRiskChange: parseFloat(revenueAtRiskChange.toFixed(1)),
      recoveredRevenueChange: parseFloat(recoveredRevenueChange.toFixed(1)),
      recoveryRateChange: 0, // Would need previous period calculation
      // Time metrics
      avgRecoveryTime: {
        hours: avgRecoveryTimeHours,
        minutes: avgRecoveryTimeMins,
        formatted: avgRecoveryTimeHours > 0 
          ? `${avgRecoveryTimeHours}h ${avgRecoveryTimeMins}m` 
          : `${avgRecoveryTimeMins}m`,
      },
      // AI evaluation metrics
      aiEvaluation: {
        precision: parseFloat(precision.toFixed(1)),
        recall: parseFloat(recall.toFixed(1)),
        falsePositiveRate: parseFloat(falsePositiveRate.toFixed(1)),
        humanOverrideRate: 0, // Would need tracking of human overrides
      },
    };
  },

  /**
   * Revenue recovery funnel
   */
  async getRecoveryFunnel(merchantId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const mId = Types.ObjectId.isValid(merchantId) ? new Types.ObjectId(merchantId) : merchantId;

    const [totalPayments, failed, analyzed, recoverable, attempted, recovered] =
      await Promise.all([
        Payment.countDocuments({ merchantId: mId, createdAt: { $gte: since } }),
        Payment.countDocuments({ merchantId: mId, createdAt: { $gte: since }, status: PAYMENT_STATUS.FAILED }),
        RecoveryCase.countDocuments({ merchantId: mId, createdAt: { $gte: since }, status: { $ne: RECOVERY_CASE_STATUS.NEW } }),
        RecoveryCase.countDocuments({
          merchantId: mId,
          createdAt: { $gte: since },
          status: { $in: [RECOVERY_CASE_STATUS.RECOVERABLE, RECOVERY_CASE_STATUS.IN_RECOVERY, RECOVERY_CASE_STATUS.RECOVERED] },
        }),
        RecoveryCase.countDocuments({
          merchantId: mId,
          createdAt: { $gte: since },
          status: { $in: [RECOVERY_CASE_STATUS.IN_RECOVERY, RECOVERY_CASE_STATUS.RECOVERED] },
        }),
        RecoveryCase.countDocuments({ merchantId: mId, createdAt: { $gte: since }, status: RECOVERY_CASE_STATUS.RECOVERED }),
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
  async getFailureBreakdown(merchantId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const mId = Types.ObjectId.isValid(merchantId) ? new Types.ObjectId(merchantId) : merchantId;

    return Payment.aggregate([
      { $match: { merchantId: mId, createdAt: { $gte: since }, status: PAYMENT_STATUS.FAILED } },
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
  async getRecoveryTrend(merchantId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const mId = Types.ObjectId.isValid(merchantId) ? new Types.ObjectId(merchantId) : merchantId;

    return RecoveryCase.aggregate([
      { $match: { merchantId: mId, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          atRisk: { $sum: '$amountAtRisk' },
          recovered: {
            $sum: {
              $cond: [{ $eq: ['$status', RECOVERY_CASE_STATUS.RECOVERED] }, '$recoveredAmount', 0],
            },
          },
          cases: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  },

  /**
   * A/B Experiment metrics
   */
  async getABExperimentMetrics(merchantId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const mId = Types.ObjectId.isValid(merchantId) ? new Types.ObjectId(merchantId) : merchantId;

    // Get experiment results by strategy/variant
    const experimentResults = await RecoveryCase.aggregate([
      {
        $match: {
          merchantId: mId,
          createdAt: { $gte: since },
          experimentVariant: { $exists: true },
        },
      },
      {
        $group: {
          _id: '$experimentVariant',
          totalCases: { $sum: 1 },
          recoveredCases: {
            $sum: {
              $cond: [{ $eq: ['$status', RECOVERY_CASE_STATUS.RECOVERED] }, 1, 0],
            },
          },
          recoveredAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', RECOVERY_CASE_STATUS.RECOVERED] }, '$recoveredAmount', 0],
            },
          },
          avgRecoveryTimeMs: {
            $avg: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', RECOVERY_CASE_STATUS.RECOVERED] },
                    { $ne: ['$recoveredAt', null] },
                    { $ne: ['$recoveredAt', undefined] },
                  ],
                },
                { $subtract: ['$recoveredAt', '$createdAt'] },
                null,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format results
    const formattedResults = experimentResults.map((result) => {
      const winRate = result.totalCases > 0 ? (result.recoveredCases / result.totalCases) * 100 : 0;
      const avgTimeMinutes = result.avgRecoveryTimeMs ? Math.round(result.avgRecoveryTimeMs / (1000 * 60)) : 0;
      const avgTimeHours = Math.floor(avgTimeMinutes / 60);
      const avgTimeMins = avgTimeMinutes % 60;

      return {
        variant: result._id,
        totalCases: result.totalCases,
        recoveredCases: result.recoveredCases,
        recoveredAmount: result.recoveredAmount,
        winRate: parseFloat(winRate.toFixed(1)),
        avgTime: {
          hours: avgTimeHours,
          minutes: avgTimeMins,
          formatted: avgTimeHours > 0 ? `${avgTimeHours}h ${avgTimeMins}m` : `${avgTimeMins}m`,
        },
      };
    });

    // Determine winning variant
    let winningVariant = null;
    if (formattedResults.length > 0) {
      const sorted = [...formattedResults].sort((a, b) => b.winRate - a.winRate);
      winningVariant = sorted[0].variant;
    }

    return {
      isActive: formattedResults.length > 0,
      winningVariant,
      variants: formattedResults,
    };
  },
};
