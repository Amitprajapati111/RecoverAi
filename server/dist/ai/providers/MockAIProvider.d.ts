import { AIProvider, AIContext, AIDecisionOutput } from './AIProvider';
/**
 * Mock AI Provider — deterministic, no API key required.
 * Uses rule-based scoring to simulate realistic AI decisions for demo/testing.
 * Clearly labeled as MOCK in all decision records.
 */
export declare class MockAIProvider extends AIProvider {
    readonly name = "MockAIProvider";
    readonly version = "v1.0";
    analyzeForRecovery(context: AIContext): Promise<AIDecisionOutput>;
    isAvailable(): Promise<boolean>;
    private calculateRecoveryScore;
    private selectAction;
    private getDelay;
    private getRiskLevel;
    private getPriority;
    private buildReason;
    private getDecisionFactors;
}
//# sourceMappingURL=MockAIProvider.d.ts.map