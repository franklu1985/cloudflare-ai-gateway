import { Env, LogLevel } from '@/types';
import { createLogger } from '@/utils/logger';
import { createErrorResponse, createCORSResponse, createSuccessResponse } from '@/utils/response';
import { handleChatCompletion } from '@/handlers/chat';
import { handleImageGeneration } from '@/handlers/images';
import { handleModels } from '@/handlers/models';
// Admin handlers removed
// Removed CustomProviderHandler import - custom providers not implemented
import { apiKeyAuthMiddleware } from '@/middleware/auth';
// Removed D1StorageService and migrateModelsToDB imports - using KV storage only

// 路由处理函数
async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // 创建日志实例
  const logger = createLogger(
    (env.LOG_LEVEL as LogLevel) || 'info',
    env.ENVIRONMENT || 'development'
  );

  // Custom provider functionality not implemented

  // 处理 CORS 预检请求
  if (method === 'OPTIONS') {
    return createCORSResponse();
  }
  
  // 路由和认证
  const isApiRoute = path.startsWith('/v1/');
  
  if (isApiRoute) {
    const authError = await apiKeyAuthMiddleware(request, env, logger);
    if (authError) return authError;
  }

  try {
    // 路由处理
    switch (true) {
      // 基础路由
      case path === '/':
        if (method === 'GET') {
          return createSuccessResponse({
            name: 'Galatea AI',
            version: '1.0.0',
            status: 'healthy',
            environment: env.ENVIRONMENT || 'development',
            timestamp: new Date().toISOString()
          });
        }
        break;

      case path === '/health':
        if (method === 'GET') {
          return createSuccessResponse({
            status: 'ok',
            timestamp: new Date().toISOString()
          });
        }
        break;

      // OpenAI 兼容API路由
      case path === '/v1/models':
        if (method === 'GET') {
          return await handleModels(request, env, logger);
        }
        break;

      case path === '/v1/chat/completions':
        if (method === 'POST') {
          return await handleChatCompletion(request, env, logger);
        }
        break;

      case path === '/v1/images/generations':
        if (method === 'POST') {
          return await handleImageGeneration(request, env, logger);
        }
        break;
        
      // Admin routes removed

      // Model migration route removed - no longer using database

      // Custom provider routes not implemented
      case path.startsWith('/custom-providers/'):
        return createErrorResponse('Custom provider functionality is not implemented', 501);

      default:
        logger.warn(`Route not found: ${method} ${path}`);
        return createErrorResponse(
          `Route ${method} ${path} not found`,
          404,
          'not_found'
        );
    }

    // 如果路径匹配但方法不匹配
    logger.warn(`Method not allowed: ${method} ${path}`);
    return createErrorResponse(
      `Method ${method} not allowed for ${path}`,
      405,
      'method_not_allowed'
    );

  } catch (error) {
    logger.error('Unhandled error in request handler', { 
      error: String(error),
      path,
      method
    });
    return createErrorResponse(
      'Internal server error',
      500,
      'internal_error'
    );
  }
}

// 导出 Cloudflare Workers 默认处理器
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return await handleRequest(request, env);
  }
} satisfies ExportedHandler<Env>;