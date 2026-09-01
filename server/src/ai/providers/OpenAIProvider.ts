import OpenAI from 'openai';
import { AIProvider, AIContext, AIDecisionOutput } from './AIProvider';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { RECOVERY_PROMPT_SYSTEM, buildRecoveryUserPrompt } from '../prompts/recoveryPrompt';

export class OpenAIProvider extends AIProvider {
  readonly name = 'OpenAIProvider';
  readonly version = 'v1.0';
  private client: OpenAI;

  constructor() {
    super();
    this.client = new OpenAI({ apiKey: env.AI_API_KEY });
  }

  async analyzeForRecovery(context: AIContext): Promise<AIDecisionOutput> {
    const userPrompt = buildRecoveryUserPrompt(context);
    const startMs = Date.now();

    try {
      const response = await this.client.chat.completions.create({
        model: env.AI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: RECOVERY_PROMPT_SYSTEM },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 800,
      });

      const latencyMs = Date.now() - startMs;
      logger.info(`OpenAI recovery analysis completed in ${latencyMs}ms`);

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content) as AIDecisionOutput;
      return parsed;
    } catch (error) {
      logger.error('OpenAI analysis failed:', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(env.AI_API_KEY);
  }
}
