"use strict";
// Application-wide constants
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGINATION = exports.DEFAULT_POLICY = exports.RATE_LIMITS = exports.PAYMENT_LINK_STATUS = exports.QUEUE_NAMES = exports.PRIORITY = exports.RISK_LEVEL = exports.ACTOR_TYPE = exports.CUSTOMER_SEGMENT = exports.RECOVERY_ACTION = exports.RECOVERY_CASE_STATUS = exports.FAILURE_TYPE = exports.PAYMENT_STATUS = exports.ROLES = void 0;
exports.ROLES = {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    ANALYST: 'ANALYST',
    SUPPORT: 'SUPPORT',
    VIEWER: 'VIEWER',
};
exports.PAYMENT_STATUS = {
    CREATED: 'created',
    AUTHORIZED: 'authorized',
    CAPTURED: 'captured',
    REFUNDED: 'refunded',
    FAILED: 'failed',
};
exports.FAILURE_TYPE = {
    INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
    BANK_TIMEOUT: 'BANK_TIMEOUT',
    BANK_DECLINED: 'BANK_DECLINED',
    CARD_EXPIRED: 'CARD_EXPIRED',
    CARD_DECLINED: 'CARD_DECLINED',
    UPI_TIMEOUT: 'UPI_TIMEOUT',
    UPI_DECLINED: 'UPI_DECLINED',
    CUSTOMER_ABANDONED: 'CUSTOMER_ABANDONED',
    NETWORK_ERROR: 'NETWORK_ERROR',
    MANDATE_FAILURE: 'MANDATE_FAILURE',
    UNKNOWN: 'UNKNOWN',
};
exports.RECOVERY_CASE_STATUS = {
    NEW: 'NEW',
    ANALYZING: 'ANALYZING',
    RECOVERABLE: 'RECOVERABLE',
    NOT_RECOVERABLE: 'NOT_RECOVERABLE',
    IN_RECOVERY: 'IN_RECOVERY',
    RECOVERED: 'RECOVERED',
    EXHAUSTED: 'EXHAUSTED',
    ESCALATED: 'ESCALATED',
    STOPPED: 'STOPPED',
};
exports.RECOVERY_ACTION = {
    RETRY_ELIGIBLE_PAYMENT: 'RETRY_ELIGIBLE_PAYMENT',
    CREATE_PAYMENT_LINK: 'CREATE_PAYMENT_LINK',
    SEND_REMINDER: 'SEND_REMINDER',
    SCHEDULE_RETRY: 'SCHEDULE_RETRY',
    REQUEST_CUSTOMER_ACTION: 'REQUEST_CUSTOMER_ACTION',
    ESCALATE_TO_HUMAN: 'ESCALATE_TO_HUMAN',
    STOP: 'STOP',
};
exports.CUSTOMER_SEGMENT = {
    NEW: 'NEW',
    REGULAR: 'REGULAR',
    LOYAL: 'LOYAL',
    HIGH_VALUE: 'HIGH_VALUE',
    AT_RISK: 'AT_RISK',
    DORMANT: 'DORMANT',
};
exports.ACTOR_TYPE = {
    USER: 'USER',
    AI: 'AI',
    SYSTEM: 'SYSTEM',
    RAZORPAY: 'RAZORPAY',
};
exports.RISK_LEVEL = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
};
exports.PRIORITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
};
exports.QUEUE_NAMES = {
    WEBHOOK: 'webhook-queue',
    AI_ANALYSIS: 'ai-analysis-queue',
    RECOVERY: 'recovery-queue',
    NOTIFICATION: 'notification-queue',
    ANALYTICS: 'analytics-queue',
};
exports.PAYMENT_LINK_STATUS = {
    CREATED: 'created',
    SENT: 'sent',
    PAID: 'paid',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
};
// Rate limits
exports.RATE_LIMITS = {
    AUTH: { windowMs: 15 * 60 * 1000, max: 10 },
    API: { windowMs: 60 * 1000, max: 100 },
    AI: { windowMs: 60 * 1000, max: 20 },
    WEBHOOK: { windowMs: 60 * 1000, max: 500 },
};
// Default policy
exports.DEFAULT_POLICY = {
    maxAttempts: 3,
    maxAmountPerAction: 100000, // ₹1 lakh in paise
    minimumRecoveryProbability: 0.55,
    cooldownMinutes: 30,
    allowedActions: [
        exports.RECOVERY_ACTION.CREATE_PAYMENT_LINK,
        exports.RECOVERY_ACTION.SEND_REMINDER,
        exports.RECOVERY_ACTION.SCHEDULE_RETRY,
        exports.RECOVERY_ACTION.ESCALATE_TO_HUMAN,
        exports.RECOVERY_ACTION.STOP,
    ],
    requireApprovalAboveAmount: 1000000, // ₹10,000 in paise
    stopAfterSuccessfulPayment: true,
    stopAfterMaxAttempts: true,
};
// Pagination defaults
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
//# sourceMappingURL=constants.js.map