export declare const analyticsService: {
    /**
     * Get dashboard KPIs for a merchant
     */
    getDashboardKPIs(merchantId: string, days?: number): Promise<{
        revenueAtRisk: any;
        recoverableRevenue: number;
        recoveredRevenue: any;
        recoveryRate: number;
        failedPayments: any;
        totalPayments: any;
        successfulPayments: any;
        aiActions: number;
        humanEscalations: number;
        periodDays: number;
    }>;
    /**
     * Revenue recovery funnel
     */
    getRecoveryFunnel(merchantId: string, days?: number): Promise<{
        stage: string;
        count: number;
    }[]>;
    /**
     * Failure breakdown by type
     */
    getFailureBreakdown(merchantId: string, days?: number): Promise<any[]>;
    /**
     * Recovery performance over time (daily)
     */
    getRecoveryTrend(merchantId: string, days?: number): Promise<any[]>;
};
//# sourceMappingURL=analytics.service.d.ts.map