# Monorepo 重构计划

## 1. 移除测试目录
- 删除 `test/` 目录及其所有内容（cjs/ 和 vue/）

## 2. 重构为 Monorepo 结构
```
wechat-to-markdown/
├── packages/
│   ├── core/              # 核心业务包（现有的 src/ 代码）
│   │   ├── src/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── ...
│   └── mcp/               # MCP 服务包（新增）
│       ├── src/
│       ├── package.json
│       └── ...
├── package.json           # 根 package.json（更新）
├── pnpm-workspace.yaml    # 更新 workspace 配置
└── ...                    # 其他根配置文件
```

## 3. 创建 packages/core 包
- 将现有 `src/` 目录代码移动到 `packages/core/src/`
- 创建 `packages/core/package.json`（包名：`@yc-w-cn/wechat-to-markdown-core`）
- 创建 `packages/core/tsconfig.json`
- 移动 `jest.config.js` 到 `packages/core/`
- 移动 `typings/` 到 `packages/core/`

## 4. 创建 packages/mcp 包
- 创建 `packages/mcp/` 目录结构
- 创建 `packages/mcp/src/index.ts`（MCP 服务入口）
- 创建 `packages/mcp/package.json`（包名：`@yc-w-cn/wechat-to-markdown-mcp`）
- 创建 `packages/mcp/tsconfig.json`
- 实现 MCP 工具，包装核心业务的 `transformHtml2Markdown` 函数

## 5. 更新根配置文件
- 更新 `pnpm-workspace.yaml` 配置 workspace
- 更新根 `package.json`（移除业务相关配置，保留开发工具配置）
- 更新 `.gitignore`（添加 `packages/*/dist`）
- 更新 `eslint.config.js`（适配 monorepo 结构）

## 6. 清理根目录
- 删除根目录下的 `src/` 目录（已移动到 packages/core）
- 删除 `typings/` 目录（已移动到 packages/core）
- 删除 `jest.config.js`（已移动到 packages/core）
- 保留 `tools/`、`.vscode/`、`.trae/` 等配置目录