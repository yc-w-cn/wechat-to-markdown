# 移除 turndown-plugin-gfm 依赖并重构命名

## 1. 移除 turndown-plugin-gfm 依赖
- 从 `package.json` 中移除 `turndown-plugin-gfm` 依赖

## 2. 重构命名（将 turndown 改为业务相关词汇）
- 文件重命名：`turndownCode.ts` → `htmlToMarkdown.ts`
- 变量重命名：`turndownService` → `markdownService`
- 移除 `import { gfm } from 'turndown-plugin-gfm'`
- 移除 `turndownService.use(gfm)` 调用

## 3. 添加自定义 GFM 规则
在 `htmlToMarkdown.ts` 中添加自定义规则以替代 GFM 功能：
- 表格转换规则（`<table>` → Markdown 表格）
- 删除线转换规则（`<s>`, `<del>`, `<strike>` → `~~文本~~`）

## 4. 配置 Jest
- 在 `package.json` 中添加 `jest` 到 devDependencies
- 添加 `test` 脚本：`jest --coverage`
- 创建 `jest.config.js` 配置文件

## 5. 创建单元测试文件
为每个源文件创建对应的 `.spec.ts` 测试文件：
- `src/error.spec.ts` - 测试 errObj
- `src/formatHtml.spec.ts` - 测试 formatCode 和 figure2markdown
- `src/htmlToMarkdown.spec.ts` - 测试 markdownService 配置和自定义规则
- `src/type.spec.ts` - 测试类型定义和枚举
- `src/index.spec.ts` - 测试 transformHtml2Markdown 主函数（使用 mock）

## 6. 更新导入引用
- `src/index.ts` 中的导入从 `'./turndownCode'` 改为 `'./htmlToMarkdown'`