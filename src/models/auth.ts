// User and UserRole removed - not used in current implementation

/**
 * API密钥状态枚举
 */
export enum ApiKeyStatus {
  ACTIVE = 'active',      // 活跃
  DISABLED = 'disabled',  // 已禁用
  EXPIRED = 'expired'     // 已过期
}

/**
 * API密钥接口
 */
export interface ApiKey {
  id: string;           // 密钥ID
  key: string;          // 密钥值
  userId: string;       // 所属用户ID
  name: string;         // 密钥名称
  enabled: boolean;     // 是否启用
  status: ApiKeyStatus; // 密钥状态
  lastUsedAt?: number;  // 最后使用时间
  createdAt: number;    // 创建时间
  expiresAt?: number;   // 过期时间
}

/**
 * 密钥使用统计接口
 */
export interface ApiKeyUsage {
  keyId: string;        // 密钥ID
  requests: number;     // 请求次数
  tokens: number;       // 使用的token数量
  lastUpdated: number;  // 最后更新时间
}

/**
 * 生成随机API密钥
 * @returns 生成的API密钥
 */
export function generateApiKey(): string {
  const prefix = 'gal';
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);
  
  // 将随机字节转换为base64，然后替换掉特殊字符
  const base64 = btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .replace(/=/g, '');
  
  return `${prefix}_${base64}`;
}

/**
 * 验证API密钥格式是否有效
 * @param apiKey API密钥
 * @returns 是否有效
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  return /^gal_[A-Za-z0-9]{32}$/.test(apiKey);
}

/**
 * 计算API密钥的当前状态
 */
export function calculateApiKeyStatus(apiKey: ApiKey): ApiKeyStatus {
  const now = Date.now();
  
  // 检查是否已过期
  if (apiKey.expiresAt && now > apiKey.expiresAt) {
    return ApiKeyStatus.EXPIRED;
  }
  
  // 检查是否被禁用
  if (!apiKey.enabled) {
    return ApiKeyStatus.DISABLED;
  }
  
  // 默认为活跃状态
  return ApiKeyStatus.ACTIVE;
}

/**
 * 从请求中提取API密钥
 * @param request 请求对象
 * @returns API密钥或null
 */
export function extractApiKeyFromRequest(request: Request): string | null {
  // 从Authorization header中提取
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const key = authHeader.substring(7);
    if (isValidApiKeyFormat(key)) {
      return key;
    }
  }
  
  // 从x-api-key header中提取
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader && isValidApiKeyFormat(apiKeyHeader)) {
    return apiKeyHeader;
  }
  
  return null;
}