import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { apiLimiter, authLimiter, aiLimiter } from './middleware/rateLimit.middleware';
import { isRazorpayConfigured } from './integrations/razorpay/razorpayClient';
import { getRedisClient } from './config/redis';

// Route imports
import authRoutes from './routes/auth.routes';
import merchantRoutes from './routes/merchant.routes';
import dashboardRoutes from './routes/dashboard.routes';
import paymentRoutes from './routes/payment.routes';
import customerRoutes from './routes/customer.routes';
import recoveryRoutes from './routes/recovery.routes';
import aiRoutes from './routes/ai.routes';
import campaignRoutes from './routes/campaign.routes';
import policyRoutes from './routes/policy.routes';
import approvalRoutes from './routes/approval.routes';
import analyticsRoutes from './routes/analytics.routes';
import auditRoutes from './routes/audit.routes';
import simulatorRoutes from './routes/simulator.routes';
import webhookRoutes from './routes/webhook.routes';

export function createApp(): Express {
  const app = express();

  // Security & standard middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature'],
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Health checks
  app.get('/health', async (_req: Request, res: Response) => {
    const dbConnected = mongoose.connection.readyState === 1;
    let redisConnected = false;
    try {
      const redis = getRedisClient();
      redisConnected = redis.status === 'ready' || redis.status === 'connect';
    } catch {
      redisConnected = false;
    }

    res.status(200).json({
      status: 'healthy',
      database: dbConnected ? 'connected' : 'disconnected',
      redis: redisConnected ? 'connected' : 'connecting_or_mocked',
      queue: 'healthy',
      razorpay: isRazorpayConfigured() ? 'configured' : 'demo_mode',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/ready', (_req: Request, res: Response) => {
    const dbReady = mongoose.connection.readyState === 1;
    if (dbReady) {
      res.status(200).json({ ready: true });
    } else {
      res.status(503).json({ ready: false, reason: 'Database not connected' });
    }
  });

  // Apply rate limiting
  app.use('/api/', apiLimiter);
  app.use('/api/auth', authLimiter);
  app.use('/api/ai/ask', aiLimiter);

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/merchants', merchantRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/recovery', recoveryRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/campaigns', campaignRoutes);
  app.use('/api/policies', policyRoutes);
  app.use('/api/approvals', approvalRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/audit-logs', auditRoutes);
  app.use('/api/simulator', simulatorRoutes);
  app.use('/api/webhooks', webhookRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
