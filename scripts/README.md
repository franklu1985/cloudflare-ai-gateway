# 预览环境管理员密钥初始化

本目录包含用于初始化预览环境管理员密钥的脚本。

## 文件说明

- `init-admin-key.js` - 生成管理员API密钥的核心脚本
- `README.md` - 本说明文档

## 使用方法

### 方法一：生成密钥（手动存储）

```bash
node scripts/init-admin-key.js
```

这将生成一个管理员密钥，你需要手动将其存储到KV命名空间中。

### 方法二：使用wrangler命令存储

1. 先生成密钥：
```bash
node scripts/init-admin-key.js
```

2. 使用wrangler设置密钥：
```bash
wrangler secret put ADMIN_API_KEY --env preview
```

然后输入生成的密钥值。

## 手动存储到KV

生成密钥后，可以使用wrangler命令将其存储到KV命名空间：

```bash
wrangler kv key put "apikey:YOUR_KEY_ID" "YOUR_KEY_JSON" --binding CACHE --env preview --remote
```

## 配置信息

当前预览环境配置：

- 账户ID: `7bc352477096c80e016ce104db5f3b19`
- 预览环境KV命名空间ID: `fd3685d648f54a33a53298bec0e468c6`

## 生成的密钥格式

```json
{
  "id": "uuid-v4",
  "key": "gal_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "userId": "admin",
  "name": "Preview Environment Admin Key",
  "enabled": true,
  "status": "active",
  "createdAt": 1234567890000,
  "lastUsedAt": null,
  "expiresAt": null
}
```

## 使用密钥

在API请求中添加Authorization header：

```bash
curl -H "Authorization: Bearer gal_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
     https://cloudflare-ai-gateway-preview.your-subdomain.workers.dev/v1/models
```

## 安全注意事项

1. **妥善保管密钥** - 生成的密钥具有完全访问权限
2. **不要提交到代码库** - 确保密钥不会被意外提交到Git
3. **定期轮换** - 建议定期生成新的密钥并删除旧密钥
4. **监控使用情况** - 定期检查密钥的使用日志

## 故障排除

### 常见错误

1. **KV命名空间ID错误**
   - 在Cloudflare Dashboard中确认KV命名空间ID
   - 确保使用的是预览环境的命名空间ID

2. **wrangler认证问题**
   - 确保已通过 `wrangler auth login` 登录
   - 检查wrangler配置是否正确

### 验证密钥是否正确存储

可以在Cloudflare Dashboard的KV命名空间中查看存储的密钥：

1. 登录Cloudflare Dashboard
2. 进入Workers & Pages
3. 选择KV命名空间
4. 查找以 `apikey:` 开头的键

## 支持

如果遇到问题，请检查：

1. wrangler认证状态
2. 网络连接
3. 配置信息是否正确
4. Node.js版本（建议使用Node.js 16+）