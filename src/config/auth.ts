/**
 * 认证相关配置
 */

// 缓存配置
export const CACHE_CONFIG = {
  // 缓存生存时间（毫秒）
  TTL: 5 * 60 * 1000, // 5分钟
  // 最大缓存条目数
  MAX_SIZE: 1000,
  // 清理概率（每次请求时执行清理的概率）
  CLEANUP_PROBABILITY: 0.01, // 1%
} as const;

// 速率限制配置
export const RATE_LIMIT_CONFIG = {
  // 时间窗口（毫秒）
  WINDOW: 60 * 1000, // 1分钟
  // 默认用户限制（每分钟请求数）
  DEFAULT_LIMIT: 100,
  // 突发限制（短时间内允许的最大请求数）
  BURST_LIMIT: 10,
  // 突发时间窗口（毫秒）
  BURST_WINDOW: 10 * 1000, // 10秒
} as const;

// API密钥配置
export const API_KEY_CONFIG = {
  // API密钥前缀
  PREFIX: 'gal',
  // API密钥长度（不包括前缀）
  LENGTH: 32,
  // 默认过期时间（毫秒，null表示永不过期）
  DEFAULT_EXPIRY: null,
} as const;

// 安全配置
export const SECURITY_CONFIG = {
  // 最大失败尝试次数
  MAX_FAILED_ATTEMPTS: 5,
  // 锁定时间（毫秒）
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15分钟
  // 密钥轮换提醒时间（毫秒）
  KEY_ROTATION_REMINDER: 30 * 24 * 60 * 60 * 1000, // 30天
  // 启用IP白名单
  ENABLE_IP_WHITELIST: false,
  // 启用地理位置限制
  ENABLE_GEO_RESTRICTION: false,
} as const;

// 监控配置
export const MONITORING_CONFIG = {
  // 启用详细日志
  ENABLE_DETAILED_LOGGING: true,
  // 启用性能监控
  ENABLE_PERFORMANCE_MONITORING: true,
  // 异常请求阈值
  ANOMALY_THRESHOLD: 1000, // 每分钟请求数
  // 监控数据保留时间（毫秒）
  MONITORING_RETENTION: 7 * 24 * 60 * 60 * 1000, // 7天
} as const;

// 导出所有配置
export const AUTH_CONFIG = {
  CACHE: CACHE_CONFIG,
  RATE_LIMIT: RATE_LIMIT_CONFIG,
  API_KEY: API_KEY_CONFIG,
  SECURITY: SECURITY_CONFIG,
  MONITORING: MONITORING_CONFIG,
} as const;

// 类型定义
export type AuthConfig = typeof AUTH_CONFIG;
export type CacheConfig = typeof CACHE_CONFIG;
export type RateLimitConfig = typeof RATE_LIMIT_CONFIG;
export type ApiKeyConfig = typeof API_KEY_CONFIG;
export type SecurityConfig = typeof SECURITY_CONFIG;
export type MonitoringConfig = typeof MONITORING_CONFIG;