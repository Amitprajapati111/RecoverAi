"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const AIProvider_1 = require("./AIProvider");
const env_1 = require("../../config/env");
const logger_1 = require("../../utils/logger");
const recoveryPrompt_1 = require("../prompts/recoveryPrompt");
class OpenAIProvider extends AIProvider_1.AIProvider {
    constructor() {
        super();
        this.name = 'OpenAIProvider';
        this.version = 'v1.0';
        this.client = new openai_1.default({ apiKey: env_1.env.AI_API_KEY });
    }
    async analyzeForRecovery(context) {
        const userPrompt = (0, recoveryPrompt_1.buildRecoveryUserPrompt)(context);
        const startMs = Date.now();
        try {
            const response = await this.client.chat.completions.create({
                model: env_1.env.AI_MODEL || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: recoveryPrompt_1.RECOVERY_PROMPT_SYSTEM },
                    { role: 'user', content: userPrompt },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1,
                max_tokens: 800,
            });
            const latencyMs = Date.now() - startMs;
            logger_1.logger.info(`OpenAI recovery analysis completed in ${latencyMs}ms`);
            const content = response.choices[0]?.message?.content;
            if (!content)
                throw new Error('Empty response from OpenAI');
            const parsed = JSON.parse(content);
            return parsed;
        }
        catch (error) {
            logger_1.logger.error('OpenAI analysis failed:', error);
            throw error;
        }
    }
    async isAvailable() {
        return Boolean(env_1.env.AI_API_KEY);
    }
}
exports.OpenAIProvider = OpenAIProvider;
//# sourceMappingURL=OpenAIProvider.js.map