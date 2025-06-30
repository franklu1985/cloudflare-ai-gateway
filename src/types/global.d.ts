// 全局类型声明文件
// 确保 Cloudflare Workers 类型在整个项目中可用

/// <reference types="@cloudflare/workers-types" />

// 重新导出 Cloudflare Workers 类型以确保可用性
declare global {
  // 这些类型应该从 @cloudflare/workers-types 自动可用
  // 但如果不可用，我们在这里重新声明
}

export {};