import { Env } from '../types';
import { ApiKey, ApiKeyUsage } from '../models/auth';

/**
 * KV存储服务
 * 用于管理用户、API密钥和使用统计数据
 */
export class StorageService {
  private env: Env;
  private namespace: KVNamespace;
  
  // KV存储前缀
  private readonly API_KEY_PREFIX = 'apikey:';
  private readonly API_KEY_BY_USER_PREFIX = 'user_apikeys:';
  private readonly API_KEY_USAGE_PREFIX = 'usage:';
  
  constructor(env: Env) {
    this.env = env;
    this.namespace = env.CACHE;
  }
  
  /**
   * 检查存储是否可用
   */
  isAvailable(): boolean {
    return !!this.namespace;
  }
  
  // User management methods removed - not used in current implementation
  
  /**
   * 根据API密钥值获取API密钥信息
   * @param keyValue API密钥值
   * @returns API密钥信息或null
   */
  async getApiKeyByValue(keyValue: string): Promise<ApiKey | null> {
    if (!this.isAvailable()) {
      return null;
    }
    
    const { keys } = await this.namespace.list({ prefix: this.API_KEY_PREFIX });
    
    for (const key of keys) {
      const apiKeyData = await this.namespace.get(key.name);
      
      if (apiKeyData) {
        try {
          const apiKey = JSON.parse(apiKeyData) as ApiKey;
          
          if (apiKey.key === keyValue) {
            return apiKey;
          }
        } catch (e) {
          // 在生产环境中，最好有一个更健壮的错误处理机制
        }
      }
    }
    
    return null;
  }
  
  /**
   * 获取API密钥信息
   * @param keyId API密钥ID
   * @returns API密钥信息或null
   */
  async getApiKey(keyId: string): Promise<ApiKey | null> {
    if (!this.isAvailable()) return null;
    
    const apiKeyData = await this.namespace.get(`${this.API_KEY_PREFIX}${keyId}`);
    if (!apiKeyData) return null;
    
    try {
      return JSON.parse(apiKeyData) as ApiKey;
    } catch (e) {
      return null;
    }
  }
  
  /**
   * 保存API密钥信息
   * @param apiKey API密钥信息
   */
  async saveApiKey(apiKey: ApiKey): Promise<void> {
    if (!this.isAvailable()) return;
    
    // 保存API密钥信息
    await this.namespace.put(
      `${this.API_KEY_PREFIX}${apiKey.id}`,
      JSON.stringify(apiKey)
    );
    
    // 更新用户的API密钥列表
    const userApiKeys = await this.getApiKeysByUser(apiKey.userId);
    const existingIndex = userApiKeys.findIndex(k => k.id === apiKey.id);
    
    if (existingIndex === -1) {
      userApiKeys.push(apiKey);
    } else {
      userApiKeys[existingIndex] = apiKey;
    }
    
    await this.namespace.put(
      `${this.API_KEY_BY_USER_PREFIX}${apiKey.userId}`,
      JSON.stringify(userApiKeys.map(k => k.id))
    );
  }
  
  /**
   * 获取用户的所有API密钥
   * @param userId 用户ID
   * @returns API密钥列表
   */
  async getApiKeysByUser(userId: string): Promise<ApiKey[]> {
    if (!this.isAvailable()) return [];
    
    const apiKeyIdsData = await this.namespace.get(`${this.API_KEY_BY_USER_PREFIX}${userId}`);
    if (!apiKeyIdsData) return [];
    
    try {
      const apiKeyIds = JSON.parse(apiKeyIdsData) as string[];
      const apiKeys: ApiKey[] = [];
      
      for (const keyId of apiKeyIds) {
        const apiKey = await this.getApiKey(keyId);
        if (apiKey) {
          apiKeys.push(apiKey);
        }
      }
      
      return apiKeys;
    } catch (e) {
      return [];
    }
  }

  /**
   * 获取所有API密钥
   * @returns 所有API密钥列表
   */
  async getAllApiKeys(): Promise<ApiKey[]> {
    if (!this.isAvailable()) return [];
    
    try {
      const { keys } = await this.namespace.list({ prefix: this.API_KEY_PREFIX });
      const apiKeys: ApiKey[] = [];
      
      for (const key of keys) {
        const apiKeyData = await this.namespace.get(key.name);
        if (apiKeyData) {
          try {
            const apiKey = JSON.parse(apiKeyData) as ApiKey;
            apiKeys.push(apiKey);
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
      
      return apiKeys;
    } catch (e) {
      return [];
    }
  }
  
  /**
   * 删除API密钥
   * @param keyId API密钥ID
   */
  async deleteApiKey(keyId: string): Promise<void> {
    if (!this.isAvailable()) return;
    
    // 获取API密钥信息
    const apiKey = await this.getApiKey(keyId);
    if (!apiKey) return;
    
    // 删除API密钥信息
    await this.namespace.delete(`${this.API_KEY_PREFIX}${keyId}`);
    
    // 删除API密钥使用统计
    await this.namespace.delete(`${this.API_KEY_USAGE_PREFIX}${keyId}`);
    
    // 更新用户的API密钥列表
    const userApiKeys = await this.getApiKeysByUser(apiKey.userId);
    const updatedApiKeys = userApiKeys.filter(k => k.id !== keyId);
    
    await this.namespace.put(
      `${this.API_KEY_BY_USER_PREFIX}${apiKey.userId}`,
      JSON.stringify(updatedApiKeys.map(k => k.id))
    );
  }
  
  /**
   * 获取API密钥使用统计
   * @param keyId API密钥ID
   * @returns 使用统计或null
   */
  async getApiKeyUsage(keyId: string): Promise<ApiKeyUsage | null> {
    if (!this.isAvailable()) return null;
    
    const usageData = await this.namespace.get(`${this.API_KEY_USAGE_PREFIX}${keyId}`);
    if (!usageData) {
      // 如果不存在，创建一个新的使用统计
      const usage: ApiKeyUsage = {
        keyId,
        requests: 0,
        tokens: 0,
        lastUpdated: Date.now()
      };
      return usage;
    }
    
    try {
      return JSON.parse(usageData) as ApiKeyUsage;
    } catch (e) {
      return null;
    }
  }
  
  /**
   * 更新API密钥使用统计
   * @param keyId API密钥ID
   * @param requestCount 请求次数增量
   * @param tokenCount token数量增量
   */
  async updateApiKeyUsage(keyId: string, requestCount: number = 1, tokenCount: number = 0): Promise<void> {
    if (!this.isAvailable()) return;
    
    // 获取当前使用统计
    const usage = await this.getApiKeyUsage(keyId) || {
      keyId,
      requests: 0,
      tokens: 0,
      lastUpdated: Date.now()
    };
    
    // 更新统计数据
    usage.requests += requestCount;
    usage.tokens += tokenCount;
    usage.lastUpdated = Date.now();
    
    // 保存更新后的统计数据
    await this.namespace.put(
      `${this.API_KEY_USAGE_PREFIX}${keyId}`,
      JSON.stringify(usage)
    );
    
    // 同时更新API密钥的最后使用时间
    const apiKey = await this.getApiKey(keyId);
    if (apiKey) {
      apiKey.lastUsedAt = Date.now();
      await this.saveApiKey(apiKey);
    }
  }
  
  /**
   * 获取所有API密钥使用统计
   * @returns 使用统计列表
   */
  async getAllApiKeyUsage(): Promise<ApiKeyUsage[]> {
    if (!this.isAvailable()) return [];
    
    const { keys } = await this.namespace.list({ prefix: this.API_KEY_USAGE_PREFIX });
    const usageList: ApiKeyUsage[] = [];
    
    for (const key of keys) {
      const usageData = await this.namespace.get(key.name);
      if (usageData) {
        try {
          usageList.push(JSON.parse(usageData) as ApiKeyUsage);
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
    
    return usageList;
  }
  
  // Admin user initialization removed
}