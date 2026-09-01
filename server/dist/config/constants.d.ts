export declare const ROLES: {
    readonly OWNER: "OWNER";
    readonly ADMIN: "ADMIN";
    readonly ANALYST: "ANALYST";
    readonly SUPPORT: "SUPPORT";
    readonly VIEWER: "VIEWER";
};
export declare const PAYMENT_STATUS: {
    readonly CREATED: "created";
    readonly AUTHORIZED: "authorized";
    readonly CAPTURED: "captured";
    readonly REFUNDED: "refunded";
    readonly FAILED: "failed";
};
export declare const FAILURE_TYPE: {
    readonly INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS";
    readonly BANK_TIMEOUT: "BANK_TIMEOUT";
    readonly BANK_DECLINED: "BANK_DECLINED";
    readonly CARD_EXPIRED: "CARD_EXPIRED";
    readonly CARD_DECLINED: "CARD_DECLINED";
    readonly UPI_TIMEOUT: "UPI_TIMEOUT";
    readonly UPI_DECLINED: "UPI_DECLINED";
    readonly CUSTOMER_ABANDONED: "CUSTOMER_ABANDONED";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly MANDATE_FAILURE: "MANDATE_FAILURE";
    readonly UNKNOWN: "UNKNOWN";
};
export declare const RECOVERY_CASE_STATUS: {
    readonly NEW: "NEW";
    readonly ANALYZING: "ANALYZING";
    readonly RECOVERABLE: "RECOVERABLE";
    readonly NOT_RECOVERABLE: "NOT_RECOVERABLE";
    readonly IN_RECOVERY: "IN_RECOVERY";
    readonly RECOVERED: "RECOVERED";
    readonly EXHAUSTED: "EXHAUSTED";
    readonly ESCALATED: "ESCALATED";
    readonly STOPPED: "STOPPED";
};
export declare const RECOVERY_ACTION: {
    readonly RETRY_ELIGIBLE_PAYMENT: "RETRY_ELIGIBLE_PAYMENT";
    readonly CREATE_PAYMENT_LINK: "CREATE_PAYMENT_LINK";
    readonly SEND_REMINDER: "SEND_REMINDER";
    readonly SCHEDULE_RETRY: "SCHEDULE_RETRY";
    readonly REQUEST_CUSTOMER_ACTION: "REQUEST_CUSTOMER_ACTION";
    readonly ESCALATE_TO_HUMAN: "ESCALATE_TO_HUMAN";
    readonly STOP: "STOP";
};
export declare const CUSTOMER_SEGMENT: {
    readonly NEW: "NEW";
    readonly REGULAR: "REGULAR";
    readonly LOYAL: "LOYAL";
    readonly HIGH_VALUE: "HIGH_VALUE";
    readonly AT_RISK: "AT_RISK";
    readonly DORMANT: "DORMANT";
};
export declare const ACTOR_TYPE: {
    readonly USER: "USER";
    readonly AI: "AI";
    readonly SYSTEM: "SYSTEM";
    readonly RAZORPAY: "RAZORPAY";
};
export declare const RISK_LEVEL: {
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
    readonly CRITICAL: "CRITICAL";
};
export declare const PRIORITY: {
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
    readonly CRITICAL: "CRITICAL";
};
export declare const QUEUE_NAMES: {
    readonly WEBHOOK: "webhook-queue";
    readonly AI_ANALYSIS: "ai-analysis-queue";
    readonly RECOVERY: "recovery-queue";
    readonly NOTIFICATION: "notification-queue";
    readonly ANALYTICS: "analytics-queue";
};
export declare const PAYMENT_LINK_STATUS: {
    readonly CREATED: "created";
    readonly SENT: "sent";
    readonly PAID: "paid";
    readonly CANCELLED: "cancelled";
    readonly EXPIRED: "expired";
};
export declare const RATE_LIMITS: {
    readonly AUTH: {
        readonly windowMs: number;
        readonly max: 10;
    };
    readonly API: {
        readonly windowMs: number;
        readonly max: 100;
    };
    readonly AI: {
        readonly windowMs: number;
        readonly max: 20;
    };
    readonly WEBHOOK: {
        readonly windowMs: number;
        readonly max: 500;
    };
};
export declare const DEFAULT_POLICY: {
    readonly maxAttempts: 3;
    readonly maxAmountPerAction: 100000;
    readonly minimumRecoveryProbability: 0.55;
    readonly cooldownMinutes: 30;
    readonly allowedActions: readonly ["CREATE_PAYMENT_LINK", "SEND_REMINDER", "SCHEDULE_RETRY", "ESCALATE_TO_HUMAN", "STOP"];
    readonly requireApprovalAboveAmount: 1000000;
    readonly stopAfterSuccessfulPayment: true;
    readonly stopAfterMaxAttempts: true;
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
};
//# sourceMappingURL=constants.d.ts.map