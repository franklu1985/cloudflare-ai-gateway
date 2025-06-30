/**
 * 预览环境管理员密钥初始化脚本
 * 用于为预览环境创建初始管理员API密钥
 */

// 生成API密钥的函数（与auth.ts中的逻辑一致）
function generateApiKey() {
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

// 生成UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 创建管理员API密钥
function createAdminApiKey() {
  const now = Date.now();
  const keyId = generateUUID();
  const keyValue = generateApiKey();
  
  const adminApiKey = {
    id: keyId,
    key: keyValue,
    userId: 'admin',
    name: 'Preview Environment Admin Key',
    enabled: true,
    status: 'active',
    createdAt: now,
    lastUsedAt: null,
    expiresAt: null // 永不过期
  };
  
  return adminApiKey;
}

// 主函数
async function initAdminKey() {
  console.log('🔑 正在为预览环境初始化管理员密钥...');
  
  const adminKey = createAdminApiKey();
  
  console.log('\n✅ 管理员密钥已生成:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`密钥ID: ${adminKey.id}`);
  console.log(`密钥值: ${adminKey.key}`);
  console.log(`用户ID: ${adminKey.userId}`);
  console.log(`密钥名称: ${adminKey.name}`);
  console.log(`创建时间: ${new Date(adminKey.createdAt).toISOString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('\n📋 请将以下信息保存到安全的地方:');
  console.log(`API_KEY=${adminKey.key}`);
  
  console.log('\n🔧 使用wrangler设置密钥到预览环境:');
  console.log(`wrangler secret put ADMIN_API_KEY --env preview`);
  console.log('然后输入上面生成的密钥值');
  
  console.log('\n📝 或者手动将密钥信息存储到KV:');
  console.log('KV Key:', `apikey:${adminKey.id}`);
  console.log('KV Value:', JSON.stringify(adminKey, null, 2));
  
  return adminKey;
}

// 如果直接运行此脚本
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  initAdminKey().catch(console.error);
}

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initAdminKey, createAdminApiKey, generateApiKey };
}