export declare const env: {
    NODE_ENV: "development" | "production" | "test";
    PORT: string;
    LOAD_TEST_MODE: boolean;
    MONGODB_URI: string;
    REDIS_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;
    RAZORPAY_KEY_ID: string;
    RAZORPAY_KEY_SECRET: string;
    RAZORPAY_WEBHOOK_SECRET: string;
    RAZORPAY_ENV: "test" | "live";
    DEMO_MODE: boolean;
    AI_PROVIDER: "mock" | "openai" | "anthropic";
    AI_API_KEY: string;
    AI_MODEL: string;
    FRONTEND_URL: string;
    ENCRYPTION_KEY: string;
};
export type Env = typeof env;
//# sourceMappingURL=env.d.ts.map