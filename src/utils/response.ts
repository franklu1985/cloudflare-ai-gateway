import { OpenAIError, APIResponse } from '@/types';

// 创建成功响应
export function createSuccessResponse<T>(data: T, status: number = 200): Response {
  const response: APIResponse<T> = {
    success: true,
    data,
    timestamp: Date.now()
  };
  
  return new Response(JSON.stringify(response), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// 创建错误响应
export function createErrorResponse(
  message: string, 
  status: number = 400, 
  type: string = 'invalid_request_error'
): Response {
  const error: OpenAIError = {
    error: {
      message,
      type,
      code: status.toString()
    }
  };
  
  return new Response(JSON.stringify(error), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// 创建 OpenAI 兼容的成功响应
export function createOpenAIResponse<T>(data: T): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// 处理 CORS 预检请求
export function createCORSResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// 生成唯一ID（用于 OpenAI 响应）
export function generateId(prefix: string = 'chatcmpl'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${prefix}-${timestamp}${random}`;
}

// 创建流式响应
export function createStreamResponse(stream: ReadableStream, status = 200): Response {
  return new Response(stream, {
    status,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-Accel-Buffering': 'no' // 禁用nginx缓冲，确保实时性
    }
  });
} 