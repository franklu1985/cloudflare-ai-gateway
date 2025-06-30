# 🚀 Galatea AI Gateway

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

基于 Cloudflare Workers 的统一 AI 模型网关，提供 OpenAI 兼容的 API 接口，支持多种 AI 提供商。

[English](README_EN.md) | 中文

## ✨ 特性

- 🌐 **统一接口**: OpenAI 兼容的 REST API
- 🔐 **安全认证**: 基于 API 密钥的认证系统
- ⚡ **高性能**: 基于 Cloudflare Workers 的边缘计算
- 🔄 **多提供商**: 支持多种 AI 模型提供商
- 📊 **使用统计**: API 调用和使用量追踪
- 🌍 **全球部署**: Cloudflare 全球边缘网络
- 💾 **KV 存储**: 基于 Cloudflare KV 的数据持久化

## 🤖 支持的 AI 提供商

| 提供商 | 状态 | 支持模型 |
|--------|------|----------|
| Cloudflare Workers AI | ✅ | Llama, CodeLlama, Mistral 等 |
| OpenRouter | ✅ | GPT-4, Claude, Llama 等 |
| Google Gemini | ✅ | Gemini Pro, Gemini Pro Vision |
| DeepSeek | ✅ | DeepSeek Chat, DeepSeek Coder |
| Cohere | ✅ | command-r, command-r+, command-light|
| Anthropic | 🚧| 开发中 |
| Azure OpenAI | 🚧 | 开发中 |

## 🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) 18+
- [Cloudflare 账户](https://dash.cloudflare.com/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### 安装

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-username/galatea-ai-api.git
   cd galatea-ai-api
   ```
2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境**
   ```bash
   # 复制配置文件模板
   cp wrangler.toml.example wrangler.toml
   cp .dev.vars.example .dev.vars
   
   # 编辑配置文件，填入您的实际配置
   # ⚠️ 重要：不要在代码中硬编码敏感信息
   nano wrangler.toml
   nano .dev.vars
   ```

   **安全提醒**：
   - `wrangler.toml` 和 `.dev.vars` 已被添加到 `.gitignore`
   - 请使用示例文件作为模板，填入您的实际配置
   - 绝不要将真实的密钥或账户ID提交到代码仓库

4. **创建 KV 命名空间**
   ```bash
   # 为每个环境创建 KV 命名空间
   wrangler kv:namespace create "CACHE" --env dev
   wrangler kv:namespace create "CACHE" --env preview
   wrangler kv:namespace create "CACHE" --env production
   ```

5. **生成管理员 API 密钥**
   ```bash
   # 生成开发环境密钥
   node scripts/init-admin-key.js
   
   # 将密钥添加到 KV 存储
   wrangler kv:key put "apikey:YOUR_KEY_ID" --path admin-key.json --binding CACHE --env dev --preview
   ```

### 本地开发

```bash
# 启动开发服务器
npm run dev

# 测试 API
curl -H "Authorization: Bearer YOUR_API_KEY" \
     http://localhost:8787/v1/models
```

### 部署

```bash
# 部署到预览环境
npm run deploy:preview

# 部署到生产环境
npm run deploy:production
```

## 📝 API 文档

### 认证

所有 API 请求都需要在请求头中包含有效的 API 密钥：

```bash
Authorization: Bearer gal_your_api_key_here
```

### 端点

#### 获取模型列表
```http
GET /v1/models
```

#### 聊天补全
```http
POST /v1/chat/completions
```

请求体：
```json
{
  "model": "llama-2-7b-chat",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "stream": false,
  "max_tokens": 4096
}
```

#### 图像生成
```http
POST /v1/images/generations
```

请求体：
```json
{
  "prompt": "A beautiful sunset over the ocean",
  "size": "1024x1024",
  "n": 1
}
```

## ⚙️ 配置

### 环境变量

在 `.dev.vars` 文件中配置以下环境变量：

```bash
# Cloudflare 配置
CLOUDFLARE_ACCOUNT_ID=your_account_id
AI_GATEWAY_ID=galatea-ai

# AI 提供商 API 密钥
WORKERS_AI_API_KEY=your_workers_ai_key
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key
GOOGLE_API_KEY=your_google_api_key
DEEPSEEK_API_KEY=sk-your_deepseek_key
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
```

### Wrangler 配置

在 `wrangler.toml` 中配置部署设置：

```toml
name = "galatea-ai"
main = "src/index.ts"
compatibility_date = "2024-03-20"

[vars]
ENVIRONMENT = "development"
CLOUDFLARE_ACCOUNT_ID = "your_account_id"
AI_GATEWAY_ID = "galatea-ai"

[[kv_namespaces]]
binding = "CACHE"
id = "your_kv_namespace_id"
```

## 📊 API 密钥管理

### 生成新的 API 密钥

```bash
# 使用内置脚本生成
node scripts/init-admin-key.js

# 手动创建
wrangler kv:key put "apikey:unique-key-id" \
  '{"id":"unique-key-id","key":"gal_your_key","userId":"admin","enabled":true}' \
  --binding CACHE --env production
```

### 管理 API 密钥

```bash
# 列出所有密钥
wrangler kv:key list --binding CACHE --env production

# 获取密钥详情
wrangler kv:key get "apikey:key-id" --binding CACHE --env production

# 删除密钥
wrangler kv:key delete "apikey:key-id" --binding CACHE --env production
```

## 🔧 开发

### 项目结构

```
src/
├── config/          # 配置文件
├── handlers/         # API 路由处理器
├── middleware/       # 中间件
├── models/          # 数据模型
├── services/        # 业务服务
├── types/           # TypeScript 类型定义
└── utils/           # 工具函数
    └── providers/   # AI 提供商适配器
```

### 添加新的 AI 提供商

1. 在 `src/utils/providers/` 中创建新的提供商适配器
2. 在 `src/models/index.ts` 中添加模型配置
3. 更新类型定义和文档

### 测试

```bash
# 运行测试
npm test

# 类型检查
npm run type-check

# 代码规范检查
npm run lint
```

## 📈 监控和日志

- **日志级别**: 通过 `LOG_LEVEL` 环境变量配置
- **性能监控**: 内置请求延迟和错误率统计
- **使用统计**: API 调用次数和 Token 使用量追踪

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md) 了解更多信息。

### 开发流程

1. Fork 此仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源。查看 [LICENSE](LICENSE) 文件了解更多信息。

## 🔗 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)

## ❓ 常见问题

### Q: 如何获取 Cloudflare 账户 ID？
A: 登录 Cloudflare Dashboard，在右侧边栏可以找到您的账户 ID。

### Q: 支持哪些模型？
A: 支持的模型列表请查看 `/v1/models` 端点或访问 [PROVIDERS.md](PROVIDERS.md)。

### Q: 如何处理速率限制？
A: 系统内置速率限制功能，可在 `src/config/auth.ts` 中配置限制参数。

### Q: 可以自定义模型配置吗？
A: 可以在 `src/models/index.ts` 中添加或修改模型配置。

## 📞 支持

如果您遇到问题或有任何疑问，请：

- 查看 [Issues](https://github.com/your-username/galatea-ai-api/issues)
- 创建新的 Issue
- 加入我们的社区讨论 