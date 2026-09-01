"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./middleware/error.middleware");
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
const razorpayClient_1 = require("./integrations/razorpay/razorpayClient");
const redis_1 = require("./config/redis");
// Route imports
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const merchant_routes_1 = __importDefault(require("./routes/merchant.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const recovery_routes_1 = __importDefault(require("./routes/recovery.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const campaign_routes_1 = __importDefault(require("./routes/campaign.routes"));
const policy_routes_1 = __importDefault(require("./routes/policy.routes"));
const approval_routes_1 = __importDefault(require("./routes/approval.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
const simulator_routes_1 = __importDefault(require("./routes/simulator.routes"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
function createApp() {
    const app = (0, express_1.default)();
    // Security & standard middleware
    app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
    app.use((0, cors_1.default)({
        origin: [env_1.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature'],
    }));
    app.use((0, compression_1.default)());
    app.use((0, cookie_parser_1.default)());
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    if (env_1.env.NODE_ENV !== 'test') {
        app.use((0, morgan_1.default)('dev'));
    }
    // Health checks
    app.get('/health', async (_req, res) => {
        const dbConnected = mongoose_1.default.connection.readyState === 1;
        let redisConnected = false;
        try {
            const redis = (0, redis_1.getRedisClient)();
            redisConnected = redis.status === 'ready' || redis.status === 'connect';
        }
        catch {
            redisConnected = false;
        }
        res.status(200).json({
            status: 'healthy',
            database: dbConnected ? 'connected' : 'disconnected',
            redis: redisConnected ? 'connected' : 'connecting_or_mocked',
            queue: 'healthy',
            razorpay: (0, razorpayClient_1.isRazorpayConfigured)() ? 'configured' : 'demo_mode',
            environment: env_1.env.NODE_ENV,
            timestamp: new Date().toISOString(),
        });
    });
    app.get('/ready', (_req, res) => {
        const dbReady = mongoose_1.default.connection.readyState === 1;
        if (dbReady) {
            res.status(200).json({ ready: true });
        }
        else {
            res.status(503).json({ ready: false, reason: 'Database not connected' });
        }
    });
    // Apply rate limiting
    app.use('/api/', rateLimit_middleware_1.apiLimiter);
    app.use('/api/auth', rateLimit_middleware_1.authLimiter);
    app.use('/api/ai/ask', rateLimit_middleware_1.aiLimiter);
    // Mount API modules
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/merchants', merchant_routes_1.default);
    app.use('/api/dashboard', dashboard_routes_1.default);
    app.use('/api/payments', payment_routes_1.default);
    app.use('/api/customers', customer_routes_1.default);
    app.use('/api/recovery', recovery_routes_1.default);
    app.use('/api/ai', ai_routes_1.default);
    app.use('/api/campaigns', campaign_routes_1.default);
    app.use('/api/policies', policy_routes_1.default);
    app.use('/api/approvals', approval_routes_1.default);
    app.use('/api/analytics', analytics_routes_1.default);
    app.use('/api/audit-logs', audit_routes_1.default);
    app.use('/api/simulator', simulator_routes_1.default);
    app.use('/api/webhooks', webhook_routes_1.default);
    // Error handling
    app.use(error_middleware_1.notFoundHandler);
    app.use(error_middleware_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map