// 环境变量类型定义
export interface Env {
  // Cloudflare Workers AI 绑定
  AI: any; // Cloudflare Workers AI binding
  
  // KV 存储绑定 (必需)
  CACHE: KVNamespace; // KV Namespace binding (required)
  
  // 基础环境变量
  ENVIRONMENT: string;
  LOG_LEVEL: string;
  
  // ========================================
  // AI Gateway 配置 (必需)
  // ========================================
  CLOUDFLARE_ACCOUNT_ID: string;
  AI_GATEWAY_ID: string;
  
  // ========================================
  // AI Providers API 密钥 (各自独立)
  // ========================================
  
  // Workers AI API 密钥 (AI Provider)
  WORKERS_AI_API_KEY: string;    // Cloudflare Workers AI
  
  // OpenAI API 密钥
  OPENAI_API_KEY?: string;
  
  // Anthropic Claude API 密钥
  ANTHROPIC_API_KEY?: string;
  
  // Google Gemini API 密钥
  GOOGLE_API_KEY?: string;        // Google Gemini (optional)
  
  // Cohere API 密钥
  COHERE_API_KEY?: string;
  
  // Hugging Face API 密钥
  HUGGINGFACE_API_KEY?: string;
  
  // Azure OpenAI 配置
  AZURE_OPENAI_API_KEY?: string;
  AZURE_OPENAI_ENDPOINT?: string;
  
  // 自定义 API 密钥 (JSON 格式)
  CUSTOM_API_KEYS?: string;
  
  // OpenRouter API 密钥
  OPENROUTER_API_KEY?: string;    // OpenRouter (optional)
  
  // Grok API 密钥
  GROK_API_KEY?: string;          // Grok (optional)
  
  // 国内 AI 提供商 API 密钥
  DEEPSEEK_API_KEY?: string;      // DeepSeek (optional)
  DOUBAO_API_KEY?: string;        // 豆包/字节跳动 (optional)
  ARK_API_KEY?: string;           // 豆包API的官方环境变量名称 (optional)
  QWEN_API_KEY?: string;          // 通义千问/阿里巴巴 (optional)
  
  // 移除D1数据库依赖，改用KV存储
}

// OpenAI API 兼容类型定义
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface OpenAIChatCompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  user?: string;
}

export interface OpenAIChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: OpenAIChatCompletionChoice[];
  usage: OpenAIUsage;
}

export interface OpenAIChatCompletionChoice {
  index: number;
  message: OpenAIMessage;
  finish_reason: 'stop' | 'length' | 'content_filter' | null;
}

export interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// OpenAI 流式响应块
export interface OpenAIStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: 'stop' | 'length' | 'content_filter' | null;
  }[];
}

export interface OpenAIError {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

// 模型映射定义
export interface ModelMapping {
  openai_name: string;
  cf_name: string;
  description: string;
  max_tokens: number;
}

// 供应商配置信息
export interface ProviderConfig {
  name: string;
  api_key_env: keyof Env;
  endpoint?: string;
  required: boolean;
}

// 日志级别
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// API 响应包装器
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// AI 模型配置类型定义
export interface ModelConfig {
  id: string;
  name: string;
  description?: string;
  provider: 'workers-ai' | 'openrouter' | 'google' | 'deepseek' | 'doubao' | 'qwen' | 'anthropic' | 'cohere' | string;
  endpoint: string;
  maxTokens: number;
  supportedFeatures: string[];
  enabled?: boolean;
}

// 图像生成请求类型定义
export interface ImageGenerationRequest {
  model: string;
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
}

// 图像生成响应类型定义
export interface ImageGenerationResponse {
  id: string;
  object: 'image.generation';
  created: number;
  model: string;
  data: ImageData[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ImageData {
  url?: string;                   // 图像URL
  b64_json?: string;              // Base64编码的图像数据
  revised_prompt?: string;        // 修订后的提示词
}

// 错误响应
export interface ErrorResponse {
  // ... existing code ...
}

// AI 模型配置类型定义 (数据库存储)
export interface AIModel extends ModelConfig {
  enabled: boolean;               // 是否启用
  createdAt: number;              // 创建时间 (Unix timestamp)
  updatedAt: number;              // 更新时间 (Unix timestamp)
}

// 模型调用统计
export interface ModelUsage {
    id: string;                   // 数据库中的自增ID
    modelId: string;              // 模型ID
    userId: string;               // 用户ID
    apiKeyId: string;             // API Key ID
    promptTokens: number;         // 输入 aken
    completionTokens: number;     // 输出 token
    totalTokens: number;          // 总 token
    latency: number;              // 延迟 (ms)
    createdAt: number;            // 创建时间 (Unix timestamp)
}

// 模型使用统计数据
export interface ModelUsageStat {
    modelId: string;
    totalRequests: number;
    totalTokens: number;
}

// 统计查询参数
export interface UsageStatsParams {
    groupBy?: 'model' | 'provider' | 'user';
    userId?: string;
    startDate?: number; // Unix timestamp (milliseconds)
    endDate?: number;   // Unix timestamp (milliseconds)
}

export interface APIKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  scopes: string; // e.g., "chat:read,chat:write"
  enabled: boolean;
}

export interface CustomProvider {
  id: string;
  name: string;
  description: string;
  baseURL: string;
  apiKey: string;
  apiKeyEnvVar: string;
  headers: any;
  defaultParams: any;
}