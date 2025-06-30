# 🚀 Galatea AI Gateway

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

A unified AI model gateway built on Cloudflare Workers, providing OpenAI-compatible API interfaces with support for multiple AI providers.

English | [中文](README.md)

## ✨ Features

- 🌐 **Unified Interface**: OpenAI-compatible REST API
- 🔐 **Secure Authentication**: API key-based authentication system
- ⚡ **High Performance**: Edge computing powered by Cloudflare Workers
- 🔄 **Multi-Provider**: Support for multiple AI model providers
- 📊 **Usage Analytics**: API call and usage tracking
- 🌍 **Global Deployment**: Cloudflare's global edge network
- 💾 **KV Storage**: Data persistence with Cloudflare KV

## 🤖 Supported AI Providers

| Provider | Status | Supported Models |
|----------|--------|------------------|
| Cloudflare Workers AI | ✅ | Llama, CodeLlama, Mistral, etc. |
| OpenRouter | ✅ | GPT-4, Claude, Llama, etc. |
| Google Gemini | ✅ | Gemini Pro, Gemini Pro Vision |
| DeepSeek | ✅ | DeepSeek Chat, DeepSeek Coder |
| Anthropic | ✅ | Claude 3.5 Sonnet, Claude 3 Opus |
| Azure OpenAI | 🚧 | In Development |
| Cohere | 🚧 | In Development |

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Cloudflare Account](https://dash.cloudflare.com/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### Installation

1. **Clone the repository**
   ```bash
git clone https://github.com/your-username/galatea-ai-api.git
cd galatea-ai-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy configuration templates
   cp wrangler.toml.example wrangler.toml
   cp .dev.vars.example .dev.vars
   
   # Edit configuration files with your actual settings
   # ⚠️ Important: Never hardcode sensitive information in code
   nano wrangler.toml
   nano .dev.vars
   ```

   **Security Reminder**：
   - `wrangler.toml` and `.dev.vars` are added to `.gitignore`
   - Use example files as templates and fill in your actual configuration
   - Never commit real keys or account IDs to the code repository

4. **Create KV namespaces**
   ```bash
   # Create KV namespaces for each environment
   wrangler kv:namespace create "CACHE" --env dev
   wrangler kv:namespace create "CACHE" --env preview
   wrangler kv:namespace create "CACHE" --env production
   ```

5. **Generate admin API key**
   ```bash
   # Generate development environment key
   node scripts/init-admin-key.js
   
   # Add key to KV storage
   wrangler kv:key put "apikey:YOUR_KEY_ID" --path admin-key.json --binding CACHE --env dev --preview
   ```

### Local Development

```bash
# Start development server
npm run dev

# Test API
curl -H "Authorization: Bearer YOUR_API_KEY" \
     http://localhost:8787/v1/models
```

### Deployment

```bash
# Deploy to preview environment
npm run deploy:preview

# Deploy to production environment
npm run deploy:production
```

## 📝 API Documentation

### Authentication

All API requests require a valid API key in the request header:

```bash
Authorization: Bearer gal_your_api_key_here
```

### Endpoints

#### List Models
```http
GET /v1/models
```

#### Chat Completions
```http
POST /v1/chat/completions
```

Request body:
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

#### Image Generation
```http
POST /v1/images/generations
```

Request body:
```json
{
  "prompt": "A beautiful sunset over the ocean",
  "size": "1024x1024",
  "n": 1
}
```

## ⚙️ Configuration

### Environment Variables

Configure the following environment variables in `.dev.vars`:

```bash
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
AI_GATEWAY_ID=galatea-ai

# AI Provider API Keys
WORKERS_AI_API_KEY=your_workers_ai_key
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key
GOOGLE_API_KEY=your_google_api_key
DEEPSEEK_API_KEY=sk-your_deepseek_key
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
```

### Wrangler Configuration

Configure deployment settings in `wrangler.toml`:

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

## 📊 API Key Management

### Generate New API Key

```bash
# Using built-in script
node scripts/init-admin-key.js

# Manual creation
wrangler kv:key put "apikey:unique-key-id" \
  '{"id":"unique-key-id","key":"gal_your_key","userId":"admin","enabled":true}' \
  --binding CACHE --env production
```

### Manage API Keys

```bash
# List all keys
wrangler kv:key list --binding CACHE --env production

# Get key details
wrangler kv:key get "apikey:key-id" --binding CACHE --env production

# Delete key
wrangler kv:key delete "apikey:key-id" --binding CACHE --env production
```

## 🔧 Development

### Project Structure

```
src/
├── config/          # Configuration files
├── handlers/         # API route handlers
├── middleware/       # Middleware functions
├── models/          # Data models
├── services/        # Business services
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
    └── providers/   # AI provider adapters
```

### Adding New AI Providers

1. Create a new provider adapter in `src/utils/providers/`
2. Add model configuration in `src/models/index.ts`
3. Update type definitions and documentation

### Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📈 Monitoring and Logging

- **Log Levels**: Configure via `LOG_LEVEL` environment variable
- **Performance Monitoring**: Built-in request latency and error rate tracking
- **Usage Analytics**: API call count and token usage tracking

## 🤝 Contributing

Contributions are welcome! Please see [Contributing Guide](CONTRIBUTING.md) for more information.

### Development Workflow

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for more information.

## 🔗 Related Links

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)

## ❓ FAQ

### Q: How to get Cloudflare Account ID?
A: Log in to Cloudflare Dashboard, you can find your Account ID in the right sidebar.

### Q: What models are supported?
A: Check the supported models list via `/v1/models` endpoint or visit [PROVIDERS.md](PROVIDERS.md).

### Q: How to handle rate limiting?
A: The system has built-in rate limiting functionality, you can configure limit parameters in `src/config/auth.ts`.

### Q: Can I customize model configurations?
A: Yes, you can add or modify model configurations in `src/models/index.ts`.

## 📞 Support

If you encounter any issues or have questions, please:

- Check [Issues](https://github.com/your-username/galatea-ai-api/issues)
- Create a new Issue
- Join our community discussions 