# 贡献指南 | Contributing Guide

[English](#english) | [中文](#中文)

## 中文

### 欢迎贡献！

感谢您对 Galatea AI Gateway 项目的兴趣！我们欢迎各种形式的贡献。

### 安全要求

⚠️ **重要安全提醒**：

1. **绝不要提交敏感信息**
   - API 密钥
   - 账户 ID
   - 密码或令牌
   - 任何生产环境配置

2. **使用示例文件**
   - 使用 `*.example` 文件作为模板
   - 所有敏感配置都应从环境变量读取
   - 确保 `.gitignore` 包含所有配置文件

3. **代码审查**
   - 所有 PR 都会进行安全审查
   - 包含敏感信息的 PR 将被拒绝

### 开发流程

1. **Fork 并克隆仓库**
   ```bash
   git clone https://github.com/your-username/galatea-ai-api.git
   cd galatea-ai-api
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **创建配置文件**
   ```bash
   cp wrangler.toml.example wrangler.toml
   cp .dev.vars.example .dev.vars
   # 编辑配置文件，填入您的测试配置
   ```

4. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **开发和测试**
   ```bash
   npm run dev          # 启动开发服务器
   npm run type-check   # 类型检查
   npm run lint         # 代码规范检查
   node test-dev.js     # 运行测试
   ```

6. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 添加适当的注释
- 保持函数简洁
- 使用有意义的变量名

### 测试

- 为新功能添加测试
- 确保所有测试通过
- 测试覆盖边缘情况

### 提交信息格式

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 重构代码
test: 添加测试
chore: 其他更改
```

---

## English

### Welcome Contributors!

Thank you for your interest in the Galatea AI Gateway project! We welcome contributions of all kinds.

### Security Requirements

⚠️ **Important Security Reminder**:

1. **Never commit sensitive information**
   - API keys
   - Account IDs
   - Passwords or tokens
   - Any production configuration

2. **Use example files**
   - Use `*.example` files as templates
   - All sensitive configuration should be read from environment variables
   - Ensure `.gitignore` includes all configuration files

3. **Code review**
   - All PRs undergo security review
   - PRs containing sensitive information will be rejected

### Development Workflow

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/galatea-ai-api.git
   cd galatea-ai-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create configuration files**
   ```bash
   cp wrangler.toml.example wrangler.toml
   cp .dev.vars.example .dev.vars
   # Edit configuration files with your test settings
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Develop and test**
   ```bash
   npm run dev          # Start development server
   npm run type-check   # Type checking
   npm run lint         # Code linting
   node test-dev.js     # Run tests
   ```

6. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   git push origin feature/your-feature-name
   ```

7. **Create Pull Request**

### Code Standards

- Use TypeScript
- Follow ESLint rules
- Add appropriate comments
- Keep functions concise
- Use meaningful variable names

### Testing

- Add tests for new features
- Ensure all tests pass
- Test edge cases

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add new feature
fix: fix bug
docs: update documentation
style: code formatting
refactor: refactor code
test: add tests
chore: other changes
``` 