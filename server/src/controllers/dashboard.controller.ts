import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { analyticsService } from '../services/analytics.service';
import { getQueueStats } from '../queues/queues';
import { isRazorpayConfigured, getRazorpayEnvironment } from '../integrations/razorpay/razorpayClient';
import { env } from '../config/env';
import { cache } from '../config/redis';

export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const merchantId = req.user!.merchantId;
  const days = parseInt(req.query.days as string) || 30;
  const cacheKey = `recoverai:dashboard:${merchantId}:${days}`;

  console.log('[Dashboard] Fetching dashboard data:', { merchantId: merchantId.toString(), days, cacheKey });

  // Skip cache for debugging temporary
  // try {
  //   const cachedData = await cache.get(cacheKey);
  //   if (cachedData) {
  //     console.log('[Dashboard] Returning cached data');
  //     return sendSuccess(res, cachedData);
  //   }
  // } catch {
  //   // Gracefully continue to database query if Redis read fails
  // }

  const [kpis, funnel, failureBreakdown, trend, abExperiments] = await Promise.all([
    analyticsService.getDashboardKPIs(merchantId, days),
    analyticsService.getRecoveryFunnel(merchantId, days),
    analyticsService.getFailureBreakdown(merchantId, days),
    analyticsService.getRecoveryTrend(merchantId, days),
    analyticsService.getABExperimentMetrics(merchantId, days),
  ]);

  console.log('[Dashboard] Fetched data:', { kpis, funnelCount: funnel.length, failureBreakdownCount: failureBreakdown.length, trendCount: trend.length });

  const dashboardData = { kpis, funnel, failureBreakdown, trend, abExperiments };

  try {
    await cache.set(cacheKey, dashboardData, 30); // 30s TTL
  } catch {
    // Gracefully handle if Redis set fails
  }

  sendSuccess(res, dashboardData);
});

export const getSystemStatus = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const queueStats = await getQueueStats();

  sendSuccess(res, {
    razorpay: {
      configured: isRazorpayConfigured(),
      environment: getRazorpayEnvironment(),
    },
    ai: {
      provider: env.AI_PROVIDER,
      configured: env.AI_PROVIDER === 'mock' || Boolean(env.AI_API_KEY),
    },
    queues: queueStats,
  });
});
