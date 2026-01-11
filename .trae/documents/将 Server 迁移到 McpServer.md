## 更新计划

将 `/Volumes/JZAO/j-projects/yc-w-cn/wechat-to-markdown/packages/mcp/src/index.ts` 从已弃用的 `Server` 低级 API 迁移到新的 `McpServer` 高级 API：

1. **更新导入语句**
   - 将 `Server` 改为 `McpServer`，导入路径从 `@modelcontextprotocol/sdk/server/index.js` 改为 `@modelcontextprotocol/sdk/server/mcp.js`
   - 移除 `ListToolsRequestSchema` 和 `CallToolRequestSchema` 的导入
   - 添加 `z` 的导入用于 schema 定义

2. **重构服务器初始化**
   - 将 `new Server({ name, version }, { capabilities })` 改为 `new McpServer({ name, version })`
   - 移除 capabilities 配置（McpServer 自动处理）

3. **使用 registerTool 替代 setRequestHandler**
   - 将 `setRequestHandler(ListToolsRequestSchema, ...)` 和 `setRequestHandler(CallToolRequestSchema, ...)` 替换为单个 `registerTool` 调用
   - 使用 Zod 定义 inputSchema 和 outputSchema
   - 简化工具处理逻辑

4. **保持其他代码不变**
   - 保留 `transformHtml2Markdown` 导入
   - 保留 main 函数和 transport 连接逻辑