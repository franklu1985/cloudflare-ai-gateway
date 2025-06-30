import { Env, ModelConfig, OpenAIChatCompletionResponse, ImageData } from '../../types';
import { Logger } from '../logger';
import { generateId } from '../response';
import { AIGatewayRequest, AIGatewayImageRequest, AIGatewayImageResponse } from '../ai-gateway';

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export class WorkersAIProvider {
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
    const url = `${this.baseUrl}/workers-ai/${modelConfig.endpoint}`;
    const body = {
      messages: request.messages,
      stream: request.stream || false,
      max_tokens: request.max_tokens,
      temperature: request.temperature,
      top_p: request.top_p
    };
    const headers = { 
      ...providerHeaders, 
      'Authorization': `Bearer ${this.env.WORKERS_AI_API_KEY}`, 
      'Content-Type': 'application/json' 
    };
    
    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });

    // For streaming, return the raw response
    return response;
  }

  async callImageGeneration(
    modelConfig: ModelConfig,
    request: AIGatewayImageRequest
  ): Promise<AIGatewayImageResponse> {
    const url = `${this.baseUrl}/workers-ai/${modelConfig.endpoint}`;
    
    const body = {
      prompt: request.prompt,
      width: request.width,
      height: request.height,
      steps: request.steps,
      seed: request.seed
    };

    const headers = {
      'Authorization': `Bearer ${this.env.WORKERS_AI_API_KEY}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error('Workers AI Image Generation API error', { 
        status: response.status, 
        error: errorText 
      });
      throw new Error(`Workers AI Image Generation API error: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    let b64_json: string;

    if (contentType && contentType.includes('application/json')) {
      // 处理 JSON 响应 (例如 a-la-carte-flux-1-schnell)
      const result = await response.json() as any;
      if (result.success && result.result && result.result.image) {
        b64_json = result.result.image;
      } else {
        throw new Error('Invalid JSON response format from Workers AI Image Generation API');
      }
    } else if (contentType && contentType.startsWith('image/')) {
      // 处理原始图像响应 (例如 stable-diffusion)
      const imageBuffer = await response.arrayBuffer();
      b64_json = arrayBufferToBase64(imageBuffer);
    } else {
      // 兜底处理，以防 content-type 不明确但内容是图像
      try {
        const imageBuffer = await response.arrayBuffer();
        b64_json = arrayBufferToBase64(imageBuffer);
        if (!b64_json) {
          throw new Error('Fallback failed to get b64_json');
        }
      } catch(e) {
        const errorText = await response.text();
        throw new Error(`Unsupported content type or invalid image data: ${contentType}, error: ${errorText}`);
      }
    }
    
    const imageData: ImageData[] = [{
      b64_json: b64_json,
      url: undefined,
      revised_prompt: request.prompt
    }];
    
    return {
      data: imageData,
      usage: {
        prompt_tokens: 0, // Workers AI 图像生成不提供 token 使用情况
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.env.WORKERS_AI_API_KEY) {
      errors.push('WORKERS_AI_API_KEY is required for Workers AI models');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}