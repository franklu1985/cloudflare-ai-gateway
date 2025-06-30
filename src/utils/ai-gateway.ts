import { 
  Env, 
  OpenAIMessage, 
  ModelConfig, 
  ImageData
} from '../types';

import { 
  WorkersAIProvider, 
  OpenAIProvider,
  OpenRouterProvider, 
  GoogleProvider,
  AnthropicProvider,
  AzureOpenAIProvider,
  HuggingFaceProvider,
  CohereProvider,
  MistralProvider,
  GroqProvider,
  ReplicateProvider,
  DeepSeekProvider,
  PerplexityProvider,
  BedrockProvider,
  VertexAIProvider,
  GrokProvider,
  CerebrasProvider,
  CartesiaProvider
} from './providers';

// Interfaces local to AI Gateway Client
export interface AIGatewayRequest {
  model: string;
  messages: OpenAIMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}
import { Logger } from './logger';
export interface AIGatewayImageRequest {
  model: string;
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
}

export interface AIGatewayResponse {
  choices: {
    message: { content: string, role: string };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIGatewayImageResponse {
  data: ImageData[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class AIGatewayClient {
  private env: Env;
  private logger: Logger;
  private baseUrl: string;
  
  // Core providers
  private workersAI: WorkersAIProvider;
  private openai: OpenAIProvider;
  private openRouter: OpenRouterProvider;
  private google: GoogleProvider;
  
  // Major AI providers
  private anthropic: AnthropicProvider;
  private azureOpenAI: AzureOpenAIProvider;
  private huggingface: HuggingFaceProvider;
  private cohere: CohereProvider;
  private mistral: MistralProvider;
  private groq: GroqProvider;
  private replicate: ReplicateProvider;
  private deepseek: DeepSeekProvider;
  private perplexity: PerplexityProvider;
  
  // Cloud providers
  private bedrock: BedrockProvider;
  private vertexAI: VertexAIProvider;
  
  // Specialized providers
  private grok: GrokProvider;
  private cerebras: CerebrasProvider;
  private cartesia: CartesiaProvider;

  constructor(env: Env, logger: Logger) {
    this.env = env;
    this.logger = logger;
    this.baseUrl = `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/${env.AI_GATEWAY_ID}`;
    
    // Initialize core providers
    this.workersAI = new WorkersAIProvider(env, logger);
    this.openai = new OpenAIProvider(env, logger);
    this.openRouter = new OpenRouterProvider(env, logger);
    this.google = new GoogleProvider(env, logger);
    
    // Initialize major AI providers
    this.anthropic = new AnthropicProvider(env, logger);
    this.azureOpenAI = new AzureOpenAIProvider(env, logger);
    this.huggingface = new HuggingFaceProvider(env, logger);
    this.cohere = new CohereProvider(env, logger);
    this.mistral = new MistralProvider(env, logger);
    this.groq = new GroqProvider(env, logger);
    this.replicate = new ReplicateProvider(env, logger);
    this.deepseek = new DeepSeekProvider(env, logger);
    this.perplexity = new PerplexityProvider(env, logger);
    
    // Initialize cloud providers
    this.bedrock = new BedrockProvider(env, logger);
    this.vertexAI = new VertexAIProvider(env, logger);
    
    // Initialize specialized providers
    this.grok = new GrokProvider(env, logger);
    this.cerebras = new CerebrasProvider(env, logger);
    this.cartesia = new CartesiaProvider(env, logger);
  }

  // 获取对应的供应商实例
  private getProvider(provider: string) {
    switch (provider) {
      // Core providers
      case 'workers-ai':
        return this.workersAI;
      case 'openai':
        return this.openai;
      case 'openrouter':
        return this.openRouter;
      case 'google':
        return this.google;
      
      // Major AI providers
      case 'anthropic':
        return this.anthropic;
      case 'azure-openai':
        return this.azureOpenAI;
      case 'huggingface':
        return this.huggingface;
      case 'cohere':
        return this.cohere;
      case 'mistral':
        return this.mistral;
      case 'groq':
        return this.groq;
      case 'replicate':
        return this.replicate;
      case 'deepseek':
        return this.deepseek;
      case 'perplexity':
        return this.perplexity;
      
      // Cloud providers
      case 'bedrock':
        return this.bedrock;
      case 'vertex-ai':
        return this.vertexAI;
      
      // Specialized providers
      case 'grok':
        return this.grok;
      case 'cerebras':
        return this.cerebras;
      case 'cartesia':
        return this.cartesia;
      // case 'elevenlabs':
      //   return this.elevenlabs;
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
  
  // 统一的模型调用接口
  async callModel(
    modelConfig: ModelConfig,
    request: AIGatewayRequest
  ): Promise<Response> {
    this.logger.info('Calling model via AI Gateway');

    try {
      const providerHeaders = {};
      
      const provider = this.getProvider(modelConfig.provider);
      const response = await provider.callModel(modelConfig, request, providerHeaders);
      
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`${modelConfig.provider} API error`, { status: response.status, error: errorText });
        return new Response(JSON.stringify({ error: `${modelConfig.provider} API error: ${response.status} - ${errorText}` }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      this.logger.info('Model call successful');
      return response;

    } catch (error) {
      this.logger.error('Model call failed', { model: modelConfig.id, error: String(error) });
      throw error;
    }
  }

  // 验证环境配置
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // AI Gateway 必需配置
    if (!this.env.CLOUDFLARE_ACCOUNT_ID) {
      errors.push('CLOUDFLARE_ACCOUNT_ID is required');
    }

    if (!this.env.AI_GATEWAY_ID) {
      errors.push('AI_GATEWAY_ID is required');
    }

    // AI Provider 密钥检查
    if (!this.env.WORKERS_AI_API_KEY) {
      errors.push('WORKERS_AI_API_KEY is required for Workers AI models');
    }

    // OpenRouter 和 Google 是可选的，但如果使用则需要密钥
    // 这些检查在实际调用时进行

    return {
      valid: errors.length === 0,
      errors
    };
  }



  // 统一的图像生成调用接口
  async callImageGeneration(
    modelConfig: ModelConfig,
    request: AIGatewayImageRequest
  ): Promise<AIGatewayImageResponse> {
    this.logger.info('Calling image generation model via AI Gateway');

    try {
      // 所有支持的图像模型目前都通过 Workers AI
      if (modelConfig.provider === 'workers-ai') {
        return await this.workersAI.callImageGeneration(modelConfig, request);
      } else {
        throw new Error(`Unsupported provider for image generation: ${modelConfig.provider}`);
      }

    } catch (error) {
      this.logger.error('Image generation failed', {
        model: modelConfig.id,
        provider: modelConfig.provider,
        error: String(error)
      });
      throw error;
    }
  }
}