import { Env, ModelConfig } from '../../types';
import { Logger } from '../logger';
import { AIGatewayRequest } from '../ai-gateway';

export class OpenRouterProvider {
  private env: Env;
  private logger: Logger;
  private baseUrl: string;

  constructor(env: Env, logger: Logger) {
    this.env = env;
    this.logger = logger;
    this.baseUrl = `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/${env.AI_GATEWAY_ID}`;
  }

  async callModel(
    modelConfig: ModelConfig,
    request: AIGatewayRequest,
    providerHeaders: Record<string, string>
  ): Promise<Response> {
    const url = `${this.baseUrl}/openrouter/v1/chat/completions`;
    const body = {
      model: modelConfig.endpoint,
      messages: request.messages,
      stream: request.stream || false,
      max_tokens: request.max_tokens,
      temperature: request.temperature,
      top_p: request.top_p
    };
    
    if (!this.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is required');
    }
    
    const headers = { 
      ...providerHeaders, 
      'Authorization': `Bearer ${this.env.OPENROUTER_API_KEY}`, 
      'Content-Type': 'application/json' 
    };
    
    // OpenRouter is already OpenAI compatible, so for non-streaming we can just forward the response
    // For streaming, we also forward the raw response
    return fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.env.OPENROUTER_API_KEY) {
      errors.push('OPENROUTER_API_KEY is required for OpenRouter models');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}