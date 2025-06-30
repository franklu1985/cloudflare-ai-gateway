import { ModelConfig } from '../types';
// Removed D1StorageService import - using static model configuration only

/**
 * 支持的 AI 模型配置
 * 所有模型调用都通过 Cloudflare AI Gateway 进行代理
 */
export const SUPPORTED_MODELS: Record<string, ModelConfig> = {
  // ========================================
  // Cloudflare Workers AI 模型
  // ========================================
  'llama-3-8b-instruct': {
    id: 'llama-3-8b-instruct',
    name: 'Llama 3 8B Instruct',
    description: 'Meta Llama 3 8B instruction-following model',
    provider: 'workers-ai',
    endpoint: '@cf/meta/llama-3-8b-instruct',
    maxTokens: 7968,
    supportedFeatures: ['chat', 'streaming']
  },

  'llama-3.2-1b-instruct': {  
    id: 'llama-3.2-1b-instruct',
    name: 'Llama 3.2 1B Instruct',
    description: 'Meta Llama 3.2 1B instruction-following model',
    provider: 'workers-ai',
    endpoint: '@cf/meta/llama-3.2-1b-instruct',
    maxTokens: 60000,
    supportedFeatures: ['chat', 'streaming']
  },

  'llama-3.2-3b-instruct': {  
    id: 'llama-3.2-3b-instruct',
    name: 'Llama 3.2 3B Instruct',
    description: 'Meta Llama 3.2 3B instruction-following model',
    provider: 'workers-ai',
    endpoint: '@cf/meta/llama-3.2-3b-instruct',
    maxTokens: 60000,
    supportedFeatures: ['chat', 'streaming']
  },

  'llama-3.1-8b-instruct-fp8': {  
    id: 'llama-3.1-8b-instruct-fp8',
    name: 'Llama 3.1 8B Instruct FP8',
    description: 'Meta Llama 3.1 8B instruction-following model',
    provider: 'workers-ai',
    endpoint: '@cf/meta/llama-3.1-8b-instruct-fp8',
    maxTokens: 32000,
    supportedFeatures: ['chat', 'streaming']
  },

  'llama-3.1-70b-instruct': {  
    id: 'llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B Instruct',
    description: 'Meta Llama 3.1 70B instruction-following model',
    provider: 'workers-ai',
    endpoint: '@cf/meta/llama-3.1-70b-instruct',
    maxTokens: 24000,
    supportedFeatures: ['chat', 'streaming']
  },

  /*'llama-3.2-11b-vision-instruct': {  
    id: 'llama-3.2-11b-vision-instruct',
    name: 'Llama 3.2 11B Vision Instruct',
    description: 'Meta Llama 3.2 11B instruction-following model',
    provider: 'workers-ai',
    endpoint: '@cf/meta/llama-3.2-11b-vision-instruct',
    maxTokens: 24000,
    supportedFeatures: ['chat', 'vision']
  },*/

  'llama-3.3-70b-instruct-fp8-fast': {  
    id: 'llama-3.3-70b-instruct-fp8-fast',
    name: 'Llama 3.3 70B Instruct FP8 Fast',
    description: 'Meta Llama 3.3 70B instruction-following model',
    provider: 'workers-ai',
    endpoint: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    maxTokens: 24000,
    supportedFeatures: ['chat', 'streaming']
  },  
  
  'gemma-3-12b-it': {  
    id: 'gemma-3-12b-it',
    name: 'Gemma 3 12B IT',
    description: 'Meta Gemma 3 12B instruction-following model',
    provider: 'workers-ai',
    endpoint: '@cf/google/gemma-3-12b-it',
    maxTokens: 80000,
    supportedFeatures: ['chat', 'streaming']
  },

  'mistral-small-3.1-24b-instruct': {
    id: 'mistral-small-3.1-24b-instruct',
    name: 'Mistral Small 3.1 24B Instruct',
    description: 'Mistral Small 3.1 24B instruction-following model',
    provider: 'workers-ai',
    endpoint: '@cf/mistralai/mistral-small-3.1-24b-instruct',
    maxTokens: 128000,
    supportedFeatures: ['chat', 'streaming']
  },

  'qwq-32b': {
    id: 'qwq-32b',
    name: 'QWQ 32B',
    description: 'QWQ 32B instruction-following model',
    provider: 'workers-ai',
    endpoint: '@cf/qwen/qwq-32b',
    maxTokens: 24000,
    supportedFeatures: ['chat', 'streaming', 'reasoning']
  },  

  'deepseek-r1-distill-qwen-32b': {
    id: 'deepseek-r1-distill-qwen-32b',
    name: 'DeepSeek R1 Distill Qwen 32B',
    description: 'DeepSeek R1 Distill Qwen 32B instruction-following model',
    provider: 'workers-ai',
    endpoint: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
    maxTokens: 80000,
    supportedFeatures: ['chat', 'streaming', 'reasoning']
  },

  'qwen2.5-coder-32b-instruct': {
    id: 'qwen2.5-coder-32b-instruct',
    name: 'QWen 2.5 Coder 32B Instruct',
    description: 'QWen 2.5 Coder 32B instruction-following model',
    provider: 'workers-ai',
    endpoint: '@cf/qwen/qwen2.5-coder-32b-instruct',
    maxTokens: 24000,
    supportedFeatures: ['chat', 'streaming']
  },  

  'black-forest-labs/FLUX.1-schnell': {
    id: 'black-forest-labs/FLUX.1-schnell',
    name: 'Flux 1 Schnell',
    description: 'Black Forest Labs Flux 1 Schnell text-to-image model',
    provider: 'workers-ai',
    endpoint: '@cf/black-forest-labs/flux-1-schnell',
    maxTokens: 4096,
    supportedFeatures: ['image-generation']
  },

  // ========================================
  // OpenRouter 模型 (统一路由多个AI提供商)
  // ========================================
  'openai/gpt-4.1-nano': {
    id: 'openai/gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    description: 'OpenAI GPT-4.1 Nano via OpenRouter',
    provider: 'openrouter',
    endpoint: 'openai/gpt-4.1-nano',
    maxTokens: 32000,
    supportedFeatures: ['chat', 'streaming']
  },

  'openai/gpt-4.1-mini': {
    id: 'openai/gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    description: 'OpenAI GPT-4.1 Mini via OpenRouter',
    provider: 'openrouter',
    endpoint: 'openai/gpt-4.1-mini',
    maxTokens: 32000,
    supportedFeatures: ['chat', 'streaming']
  },

  'openai/gpt-4.1': {
    id: 'openai/gpt-4.1',
    name: 'GPT-4.1',
    description: 'OpenAI GPT-4.1 via OpenRouter',
    provider: 'openrouter',
    endpoint: 'openai/gpt-4.1',
    maxTokens: 128000,
    supportedFeatures: ['chat', 'streaming']
  },

  'openai/o1-mini': {
    id: 'openai/o1-mini',
    name: 'O1 Mini',
    description: 'OpenAI O1 Mini via OpenRouter',
    provider: 'openrouter',
    endpoint: 'openai/o1-mini',
    maxTokens: 128000,
    supportedFeatures: ['chat', 'streaming', 'reasoning']
  },

  'openai/o3-mini': {
    id: 'openai/o3-mini',
    name: 'O3 Mini',
    description: 'OpenAI O3 Mini via OpenRouter',
    provider: 'openrouter',
    endpoint: 'openai/o3-mini',
    maxTokens: 128000,
    supportedFeatures: ['chat', 'streaming', 'reasoning']
  },
  
  'openai/o3-mini-high': {
    id: 'openai/o3-mini-high',
    name: 'O3 Mini High',
    description: 'OpenAI O3 Mini High via OpenRouter',
    provider: 'openrouter',
    endpoint: 'openai/o3-mini-high',
    maxTokens: 128000,
    supportedFeatures: ['chat', 'streaming', 'reasoning']
  },
  
  'openai/o4-mini': {
    id: 'openai/o4-mini',
    name: 'O4 Mini',
    description: 'OpenAI O4 Mini via OpenRouter',
    provider: 'openrouter',
    endpoint: 'openai/o4-mini',
    maxTokens: 128000,
    supportedFeatures: ['chat', 'streaming', 'reasoning']
  },

  'openai/o4-mini-high': {
    id: 'openai/o4-mini-high',
    name: 'O4 Mini High',
    description: 'OpenAI O4 Mini High via OpenRouter',
    provider: 'openrouter',
    endpoint: 'openai/o4-mini-high',
    maxTokens: 128000,
    supportedFeatures: ['chat', 'streaming', 'reasoning']
  },

  'openai/gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'OpenAI GPT-4o Mini via OpenRouter',
    provider: 'openrouter',
    endpoint: 'openai/gpt-4o-mini',
    maxTokens: 128000,
    supportedFeatures: ['chat', 'streaming']
  },

  'openai/gpt-4o-mini-search-preview': {
    id: 'openai/gpt-4o-mini-search-preview',
    name: 'GPT-4o Mini Search Preview',
    description: 'OpenAI GPT-4o Mini Search Preview via OpenRouter',
    provider: 'openrouter',
    endpoint: 'openai/gpt-4o-mini-search-preview',
    maxTokens: 128000,
    supportedFeatures: ['chat', 'streaming']
  },

  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI GPT-4o via OpenRouter',
    provider: 'openrouter',
    endpoint: 'openai/chatgpt-4o-latest',
    maxTokens: 128000,
    supportedFeatures: ['chat', 'streaming']
  },
    
  'openai/gpt-4o-search-preview': {
    id: 'openai/gpt-4o-search-preview',
    name: 'GPT-4o Search Preview',
    description: 'OpenAI GPT-4o Search Preview via OpenRouter',
    provider: 'openrouter',
    endpoint: 'openai/gpt-4o-search-preview',
    maxTokens: 128000,
    supportedFeatures: ['chat', 'streaming']
  },

  // ========================================
  // Anthropic Claude 模型 (via OpenRouter)
  // ========================================
  'anthropic/claude-3-5-haiku': {
    id: 'anthropic/claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    description: 'Anthropic Claude 3.5 Haiku',
    provider: 'openrouter',
    endpoint: 'anthropic/claude-3-5-haiku',
    maxTokens: 8192,
    supportedFeatures: ['chat', 'streaming']
  },

  'anthropic/claude-3-5-sonnet': {
    id: 'anthropic/claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic Claude 3.5 Sonnet',
    provider: 'openrouter',
    endpoint: 'anthropic/claude-3-5-sonnet',
    maxTokens: 8192,
    supportedFeatures: ['chat', 'streaming']
  },

  'anthropic/claude-3-7-sonnet': {
    id: 'anthropic/claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    description: 'Anthropic Claude 3.7 Sonnet',
    provider: 'openrouter',
    endpoint: 'anthropic/claude-3-7-sonnet',
    maxTokens: 8192,
    supportedFeatures: ['chat', 'streaming']
  },

  'anthropic/claude-3.7-sonnet:thinking': {
    id: 'anthropic/claude-3.7-sonnet:thinking',
    name: 'Claude 3.7 Sonnet Thinking',
    description: 'Anthropic Claude 3.7 Sonnet Thinking',
    provider: 'openrouter',
    endpoint: 'anthropic/claude-3.7-sonnet:thinking',
    maxTokens: 8192,
    supportedFeatures: ['chat', 'streaming', 'reasoning']
  },

  'anthropic/claude-4-sonnet': {
    id: 'anthropic/claude-4-sonnet',
    name: 'Claude 4 Sonnet',
    description: 'Anthropic Claude 4 Sonnet',
    provider: 'openrouter',
    endpoint: 'anthropic/claude-4-sonnet',
    maxTokens: 8192,
    supportedFeatures: ['chat', 'streaming']
  },  

  'deepseek/deepseek-chat-v3-0324': {
    id: 'deepseek/deepseek-chat-v3-0324',
    name: 'DeepSeek Chat V3 0324',
    description: 'DeepSeek Chat V3 0324',
    provider: 'openrouter',
    endpoint: 'deepseek/deepseek-chat-v3-0324',
    maxTokens: 8192,
    supportedFeatures: ['chat', 'streaming']
  },

  // ========================================
  // Google Gemini 模型
  // ========================================
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Google Gemini 1.5 Pro',
    provider: 'google',
    endpoint: 'gemini-1.5-pro',
    maxTokens: 8192,
    supportedFeatures: ['chat', 'streaming']
  },
  
  'gemini-2.0-flash-lite': {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    description: 'Google Gemini 2.0 Flash Lite',
    provider: 'google',
    endpoint: 'gemini-2.0-flash-lite',
    maxTokens: 8192,
    supportedFeatures: ['chat', 'streaming']
  },

  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Google Gemini 2.0 Flash',
    provider: 'google',
    endpoint: 'gemini-2.0-flash',
    maxTokens: 8192,
    supportedFeatures: ['chat', 'streaming']
  },

  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Google Gemini 2.5 Flash',
    provider: 'google',
    endpoint: 'gemini-2.5-flash',
    maxTokens: 65536,
    supportedFeatures: ['chat', 'streaming']
  },
  
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Google Gemini 2.5 Pro',
    provider: 'google',
    endpoint: 'gemini-2.5-pro',
    maxTokens: 65536,
    supportedFeatures: ['chat', 'streaming']
  },

  // ========================================
  // Cohere 模型 (直接API调用)
  // ========================================
  'command-r-plus': {
    id: 'command-r-plus',
    name: 'Command R Plus',
    description: 'Cohere Command R Plus',
    provider: 'cohere',
    endpoint: 'command-r-plus',
    maxTokens: 4096,
    supportedFeatures: ['chat', 'streaming']
  },

  'command-r': {
    id: 'command-r',
    name: 'Command R',
    description: 'Cohere Command R',
    provider: 'cohere',
    endpoint: 'command-r',
    maxTokens: 4096,
    supportedFeatures: ['chat', 'streaming']
  },

  'command-light': {
    id: 'command-light',
    name: 'Command Light',
    description: 'Cohere Command Light',
    provider: 'cohere',
    endpoint: 'command-light',
    maxTokens: 4096,
    supportedFeatures: ['chat', 'streaming']
  }
};

/**
 * 获取模型配置
 * @param modelId 模型 ID
 * @returns 模型配置
 */
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return SUPPORTED_MODELS[modelId];
}

/**
 * 获取所有模型配置
 * @param enabledOnly 只返回启用的模型（静态配置中所有模型都视为启用）
 * @returns 模型配置列表
 */
export function getAllModels(enabledOnly: boolean = false): ModelConfig[] {
  return Object.values(SUPPORTED_MODELS);
}

/**
 * 按提供商获取模型配置
 * @param provider 提供商名称
 * @returns 模型配置列表
 */
export function getModelsByProvider(provider: string): ModelConfig[] {
  const allModels = getAllModels();
  return allModels.filter(m => m.provider === provider);
}

// Model migration function removed - using static configuration only