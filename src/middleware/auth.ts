import { Env } from '../types';
import { Logger } from '../utils/logger';
import { createErrorResponse } from '../utils/response';
import { StorageService } from '../services/storage';
import { isValidApiKeyFormat } from '../models/auth';
import { AUTH_CONFIG } from '../config/auth';

// 缓存机制已移除，每次请求都直接查询KV存储

// 速率限制存储
const rateLimitStore = new Map<string, { count: number; resetTime: number; burstCount: number; burstResetTime: number }>();

// 失败尝试跟踪
const failedAttemptsStore = new Map<string, { count: number; lockoutUntil: number }>();

// 缓存清理函数已移除

/**
 * 检查速率限制（包括突发限制）
 */
function checkRateLimit(apiKeyId: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const limit = AUTH_CONFIG.RATE_LIMIT.DEFAULT_LIMIT;
  
  const current = rateLimitStore.get(apiKeyId);
  
  if (!current || now > current.resetTime) {
    // 重置或初始化计数器
    rateLimitStore.set(apiKeyId, {
      count: 1,
      resetTime: now + AUTH_CONFIG.RATE_LIMIT.WINDOW,
      burstCount: 1,
      burstResetTime: now + AUTH_CONFIG.RATE_LIMIT.BURST_WINDOW
    });
    return { allowed: true };
  }
  
  // 检查突发限制
  if (now <= current.burstResetTime) {
    if (current.burstCount >= AUTH_CONFIG.RATE_LIMIT.BURST_LIMIT) {
      return { allowed: false, reason: 'burst_limit_exceeded' };
    }
    current.burstCount++;
  } else {
    // 重置突发计数器
    current.burstCount = 1;
    current.burstResetTime = now + AUTH_CONFIG.RATE_LIMIT.BURST_WINDOW;
  }
  
  // 检查常规限制
  if (current.count >= limit) {
    return { allowed: false, reason: 'rate_limit_exceeded' };
  }
  
  current.count++;
  return { allowed: true };
}

/**
 * 清理过期的速率限制记录
 */
function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * 检查失败尝试和锁定状态
 */
function checkFailedAttempts(apiKey: string): { locked: boolean; remainingTime?: number } {
  const now = Date.now();
  const failed = failedAttemptsStore.get(apiKey);
  
  if (!failed) {
    return { locked: false };
  }
  
  if (now < failed.lockoutUntil) {
    return { locked: true, remainingTime: failed.lockoutUntil - now };
  }
  
  // 锁定期已过，清除记录
  if (now >= failed.lockoutUntil) {
    failedAttemptsStore.delete(apiKey);
  }
  
  return { locked: false };
}

/**
 * 记录失败尝试
 */
function recordFailedAttempt(apiKey: string): void {
  const now = Date.now();
  const failed = failedAttemptsStore.get(apiKey) || { count: 0, lockoutUntil: 0 };
  
  failed.count++;
  
  if (failed.count >= AUTH_CONFIG.SECURITY.MAX_FAILED_ATTEMPTS) {
    failed.lockoutUntil = now + AUTH_CONFIG.SECURITY.LOCKOUT_DURATION;
  }
  
  failedAttemptsStore.set(apiKey, failed);
}

/**
 * 清除失败尝试记录（成功认证后调用）
 */
function clearFailedAttempts(apiKey: string): void {
  failedAttemptsStore.delete(apiKey);
}

async function extractAndValidateApiKey(request: Request, env: Env): Promise<Response | null> {
    // 定期清理速率限制数据
    if (Math.random() < AUTH_CONFIG.CACHE.CLEANUP_PROBABILITY) {
      cleanupRateLimit();
    }
    
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return createErrorResponse('Authorization header is missing or invalid.', 401, 'invalid_request_error');
    }
    
    const key = authHeader.substring(7);
    
    // 基本格式验证
    if (!isValidApiKeyFormat(key)) {
        recordFailedAttempt(key);
        return createErrorResponse('Invalid API key format.', 401, 'invalid_api_key');
    }
    
    // 检查失败尝试和锁定状态
    const lockStatus = checkFailedAttempts(key);
    if (lockStatus.locked) {
        const remainingMinutes = Math.ceil((lockStatus.remainingTime || 0) / (60 * 1000));
        return createErrorResponse(
            `API key is temporarily locked due to too many failed attempts. Try again in ${remainingMinutes} minutes.`,
            423,
            'locked'
        );
    }
    
    // 直接从存储中获取，不使用缓存
    const storage = new StorageService(env);
    const apiKey = await storage.getApiKeyByValue(key);
    
    if (!apiKey || !apiKey.enabled) {
        recordFailedAttempt(key);
        return createErrorResponse('Invalid or disabled API key.', 401, 'invalid_api_key');
    }
    
    // 检查API密钥是否过期
    const now = Date.now();
    if (apiKey.expiresAt && now > apiKey.expiresAt) {
        recordFailedAttempt(key);
        return createErrorResponse('API key has expired.', 401, 'expired_api_key');
    }
    
    // 异步更新最后使用时间（不阻塞请求）
    storage.updateApiKeyUsage(apiKey.id, 1, 0).catch(err => {
        console.error('Failed to update API key usage:', err);
    });
    
    // 速率限制检查
    const rateLimitResult = checkRateLimit(apiKey.id);
    if (!rateLimitResult.allowed) {
        const limit = AUTH_CONFIG.RATE_LIMIT.DEFAULT_LIMIT;
        const message = rateLimitResult.reason === 'burst_limit_exceeded' 
            ? `Burst limit exceeded. Maximum ${AUTH_CONFIG.RATE_LIMIT.BURST_LIMIT} requests per ${AUTH_CONFIG.RATE_LIMIT.BURST_WINDOW / 1000} seconds.`
            : `Rate limit exceeded. Maximum ${limit} requests per minute.`;
        
        return createErrorResponse(message, 429, rateLimitResult.reason || 'rate_limit_exceeded');
    }
    
    // 认证成功，清除失败尝试记录
    clearFailedAttempts(key);
    
    return null; // 验证成功
}


/**
 * API密钥认证中间件
 * @param request 请求对象
 * @param env 环境变量
 * @param logger 日志记录器
 * @returns 如果认证失败，返回错误响应；如果成功，返回null
 */
export async function apiKeyAuthMiddleware(
  request: Request,
  env: Env,
  logger: Logger
): Promise<Response | null> {
  const url = new URL(request.url);
  // 公开路径，无需认证
  if (['/', '/health'].includes(url.pathname)) {
    return null;
  }
  
  const errorResponse = await extractAndValidateApiKey(request, env);
  if (errorResponse) {
      logger.warn('API key authentication failed', { path: url.pathname });
      return errorResponse;
  }
  
  logger.info('API key authentication successful', { path: url.pathname });
  return null;
}
