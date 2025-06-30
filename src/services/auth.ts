import { Env } from '../types';
import { Logger } from '../utils/logger';
import { StorageService } from './storage';
import { extractApiKeyFromRequest, isValidApiKeyFormat, ApiKey } from '../models/auth';

export async function getApiKeyFromRequest(request: Request, env: Env): Promise<ApiKey | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const key = authHeader.substring(7);
    
    const storage = new StorageService(env);
    const apiKey = await storage.getApiKeyByValue(key);

    if (!apiKey || !apiKey.enabled) {
        return null;
    }
    return apiKey;
}

/**
 * 认证服务
 * 用于验证API密钥和管理用户权限
 */
export class AuthService {
  private env: Env;
  private logger: Logger;
  private storage: StorageService;
  
  constructor(env: Env, logger: Logger) {
    this.env = env;
    this.logger = logger;
    this.storage = new StorageService(env);
  }
  
  /**
   * 验证API密钥
   * @param request 请求对象
   * @returns 验证结果，包含是否有效和API密钥信息
   */
  async validateApiKey(request: Request): Promise<{ valid: boolean; keyId?: string; userId?: string }> {
    this.logger.info('开始API密钥验证流程');
    
    // 从请求中提取API密钥
    const apiKeyValue = extractApiKeyFromRequest(request);
    
    if (!apiKeyValue) {
      this.logger.warn('API密钥未提供', {
        authHeader: request.headers.get('Authorization'),
        apiKeyHeader: request.headers.get('x-api-key')
      });
      return { valid: false };
    }
    
    this.logger.info('提取到API密钥', { apiKeyValue });
    
    // 验证API密钥格式
    if (!isValidApiKeyFormat(apiKeyValue)) {
      this.logger.warn('API密钥格式无效', { apiKey: apiKeyValue });
      return { valid: false };
    }
    
    this.logger.info('API密钥格式验证通过');
    
    // 从KV存储中获取API密钥信息
    this.logger.info('开始从KV存储查找API密钥');
    const apiKey = await this.storage.getApiKeyByValue(apiKeyValue);
    
    if (!apiKey) {
      this.logger.warn('API密钥在KV存储中不存在', { apiKeyValue });
      return { valid: false };
    }
    
    this.logger.info('在KV存储中找到API密钥', {
      keyId: apiKey.id,
      enabled: apiKey.enabled,
      status: apiKey.status,
      userId: apiKey.userId
    });
    
    if (!apiKey.enabled) {
      this.logger.warn('API密钥已被禁用', { keyId: apiKey.id });
      return { valid: false };
    }
    
    // 检查API密钥是否已过期
    if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
      this.logger.warn('API密钥已过期', { 
        keyId: apiKey.id, 
        expiresAt: apiKey.expiresAt,
        currentTime: Date.now()
      });
      return { valid: false };
    }
    
    // 更新API密钥使用统计
    await this.storage.updateApiKeyUsage(apiKey.id);
    
    this.logger.info('API密钥验证成功', { keyId: apiKey.id, userId: apiKey.userId });
    return { valid: true, keyId: apiKey.id, userId: apiKey.userId };
  }
  
  // Admin check method removed
}