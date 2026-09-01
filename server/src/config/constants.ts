// Application-wide constants

export const ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  ANALYST: 'ANALYST',
  SUPPORT: 'SUPPORT',
  VIEWER: 'VIEWER',
} as const;

export const PAYMENT_STATUS = {
  CREATED: 'created',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured',
  REFUNDED: 'refunded',
  FAILED: 'failed',
} as const;

export const FAILURE_TYPE = {
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
} as const;

export const RECOVERY_CASE_STATUS = {
  NEW: 'NEW',
  ANALYZING: 'ANALYZING',
  RECOVERABLE: 'RECOVERABLE',
  NOT_RECOVERABLE: 'NOT_RECOVERABLE',
  IN_RECOVERY: 'IN_RECOVERY',
  RECOVERED: 'RECOVERED',
  EXHAUSTED: 'EXHAUSTED',
  ESCALATED: 'ESCALATED',
  STOPPED: 'STOPPED',
} as const;

export const RECOVERY_ACTION = {
  RETRY_ELIGIBLE_PAYMENT: 'RETRY_ELIGIBLE_PAYMENT',
  CREATE_PAYMENT_LINK: 'CREATE_PAYMENT_LINK',
  SEND_REMINDER: 'SEND_REMINDER',
  SCHEDULE_RETRY: 'SCHEDULE_RETRY',
  REQUEST_CUSTOMER_ACTION: 'REQUEST_CUSTOMER_ACTION',
  ESCALATE_TO_HUMAN: 'ESCALATE_TO_HUMAN',
  STOP: 'STOP',
} as const;

export const CUSTOMER_SEGMENT = {
  NEW: 'NEW',
  REGULAR: 'REGULAR',
  LOYAL: 'LOYAL',
  HIGH_VALUE: 'HIGH_VALUE',
  AT_RISK: 'AT_RISK',
  DORMANT: 'DORMANT',
} as const;

export const ACTOR_TYPE = {
  USER: 'USER',
  AI: 'AI',
  SYSTEM: 'SYSTEM',
  RAZORPAY: 'RAZORPAY',
} as const;

export const RISK_LEVEL = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export const PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export const QUEUE_NAMES = {
  WEBHOOK: 'webhook-queue',
  AI_ANALYSIS: 'ai-analysis-queue',
  RECOVERY: 'recovery-queue',
  NOTIFICATION: 'notification-queue',
  ANALYTICS: 'analytics-queue',
} as const;

export const PAYMENT_LINK_STATUS = {
  CREATED: 'created',
  SENT: 'sent',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

// Rate limits
export const RATE_LIMITS = {
  AUTH: { windowMs: 15 * 60 * 1000, max: 10 },
  API: { windowMs: 60 * 1000, max: 100 },
  AI: { windowMs: 60 * 1000, max: 20 },
  WEBHOOK: { windowMs: 60 * 1000, max: 500 },
} as const;

// Default policy
export const DEFAULT_POLICY = {
  maxAttempts: 3,
  maxAmountPerAction: 100000, // ₹1 lakh in paise
  minimumRecoveryProbability: 0.55,
  cooldownMinutes: 30,
  allowedActions: [
    RECOVERY_ACTION.CREATE_PAYMENT_LINK,
    RECOVERY_ACTION.SEND_REMINDER,
    RECOVERY_ACTION.SCHEDULE_RETRY,
    RECOVERY_ACTION.ESCALATE_TO_HUMAN,
    RECOVERY_ACTION.STOP,
  ],
  requireApprovalAboveAmount: 1000000, // ₹10,000 in paise
  stopAfterSuccessfulPayment: true,
  stopAfterMaxAttempts: true,
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
