import { Logger } from '../logger';
import { Env, ModelConfig } from '../../types';
import { AIGatewayRequest } from '../ai-gateway';

export class DeepSeekProvider {
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
    const url = `${this.baseUrl}/deepseek/v1/chat/completions`;
    
    const deepseekBody = {
      model: modelConfig.endpoint,
      messages: request.messages,
      stream: request.stream || false,
      max_tokens: request.max_tokens,
      temperature: request.temperature,
      top_p: request.top_p,
      frequency_penalty: request.frequency_penalty,
      presence_penalty: request.presence_penalty,
      stop: request.stop
    };

    const headers = {
      ...providerHeaders,
      'Authorization': `Bearer ${this.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    };

    return await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(deepseekBody)
    });
  }

  validateConfig(): boolean {
    if (!this.env.DEEPSEEK_API_KEY) {
      this.logger.error('DEEPSEEK_API_KEY is required for DeepSeek provider');
      return false;
    }
    return true;
  }
}