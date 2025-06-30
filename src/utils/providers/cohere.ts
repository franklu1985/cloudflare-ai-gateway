import { Logger } from '../logger';
import { Env, ModelConfig } from '../../types';
import { AIGatewayRequest } from '../ai-gateway';

export class CohereProvider {
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
    const url = `${this.baseUrl}/cohere/v1/chat`;
    
    // Transform OpenAI format to Cohere format
    const cohereBody = {
      model: modelConfig.endpoint,
      message: this.getLastUserMessage(request.messages),
      chat_history: this.formatChatHistory(request.messages),
      max_tokens: request.max_tokens || 1024,
      temperature: request.temperature || 0.7,
      p: request.top_p || 0.9,
      stream: request.stream || false
    };

    const headers = {
      ...providerHeaders,
      'Authorization': `Bearer ${this.env.COHERE_API_KEY}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(cohereBody)
    });

    return response;
  }

  private getLastUserMessage(messages: any[]): string {
    // Get the last user message for Cohere's message field
    const userMessages = messages.filter(msg => msg.role === 'user');
    return userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';
  }

  private formatChatHistory(messages: any[]): any[] {
    // Convert OpenAI messages to Cohere chat history format
    const history = [];
    for (let i = 0; i < messages.length - 1; i++) { // Exclude the last message
      const msg = messages[i];
      if (msg.role === 'user') {
        history.push({ role: 'USER', message: msg.content });
      } else if (msg.role === 'assistant') {
        history.push({ role: 'CHATBOT', message: msg.content });
      }
    }
    return history;
  }

  validateConfig(): boolean {
    if (!this.env.COHERE_API_KEY) {
      this.logger.error('COHERE_API_KEY is required for Cohere provider');
      return false;
    }
    return true;
  }
}