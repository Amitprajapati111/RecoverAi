export interface SimulationParams {
    count: number;
    successRate?: number;
    averageOrderValue?: number;
    upiPercent?: number;
    cardPercent?: number;
    subscriptionPercent?: number;
    repeatCustomerRate?: number;
}
export interface SimulationResult {
    totalGenerated: number;
    successfulPayments: number;
    failedPayments: number;
    recoveryCasesCreated: number;
    analysisCompleted: number;
    recovered: number;
    recoveredAmount: number;
    totalAtRisk: number;
    aiDecisions: number;
    humanEscalations: number;
    blockedByPolicy: number;
    isSimulated: true;
    label: 'SIMULATED DATA';
}
export declare class DataGenerator {
    generateDataset(merchantId: string, params: SimulationParams): Promise<SimulationResult>;
    /**
     * The "Winning Demo" scenario — Rahul Sharma's ₹4,999 payment
     */
    runWinningDemo(merchantId: string): Promise<{
        customer: any;
        payment: any;
        recoveryCase: any;
        aiDecision: any;
        paymentLink: any;
        result: string;
        isSimulated: true;
    }>;
    private getOrCreateCustomers;
    private generateAmount;
    private selectFailureType;
    private getFailureReason;
}
export declare const dataGenerator: DataGenerator;
//# sourceMappingURL=dataGenerator.d.ts.map