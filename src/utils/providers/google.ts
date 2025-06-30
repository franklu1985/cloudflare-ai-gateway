import { Env, OpenAIMessage, ModelConfig, OpenAIChatCompletionResponse } from '../../types';
import { Logger } from '../logger';
import { generateId } from '../response';
import { AIGatewayRequest } from '../ai-gateway';

export class GoogleProvider {
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
    const googleBaseUrl = `${this.baseUrl}/google-ai-studio`;
    const stream = request.stream || false;
    const url = `${googleBaseUrl}/v1/models/${modelConfig.endpoint}:${stream ? 'streamGenerateContent' : 'generateContent'}`;
    
    const body = {
      contents: request.messages.map((msg: OpenAIMessage) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        maxOutputTokens: request.max_tokens || 2048,
        temperature: request.temperature || 0.7,
        topP: request.top_p || 1.0
      }
    };

    if (!this.env.GOOGLE_API_KEY) {
      throw new Error('Google API key is required');
    }

    const headers = {
      ...providerHeaders,
      'x-goog-api-key': this.env.GOOGLE_API_KEY,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });

    return response;
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.env.GOOGLE_API_KEY) {
      errors.push('GOOGLE_API_KEY is required for Google models');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}