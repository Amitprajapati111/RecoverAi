import { AIProvider, AIContext, AIDecisionOutput } from './AIProvider';
export declare class OpenAIProvider extends AIProvider {
    readonly name = "OpenAIProvider";
    readonly version = "v1.0";
    private client;
    constructor();
    analyzeForRecovery(context: AIContext): Promise<AIDecisionOutput>;
    isAvailable(): Promise<boolean>;
}
//# sourceMappingURL=OpenAIProvider.d.ts.map