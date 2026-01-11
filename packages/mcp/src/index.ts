// 安装依赖: pnpm add zod
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import * as z from 'zod'
import transformHtml2Markdown from '@yc-w-cn/wechat-to-markdown-core'

const server = new McpServer({
  name: 'wechat-to-markdown-mcp',
  version: '1.0.0',
})

server.registerTool(
  'transform_wechat_url_to_markdown',
  {
    title: '微信文章转 Markdown',
    description: '将微信公众号文章 URL 转换为 Markdown 格式',
    inputSchema: {
      url: z.string().describe('微信公众号文章的 URL 地址'),
    },
    outputSchema: {
      title: z.string().describe('文章标题'),
      author: z.string().describe('文章作者'),
      content: z.string().describe('Markdown 格式的文章内容'),
    },
  },
  async ({ url }) => {
    if (!url) {
      throw new Error('URL 参数不能为空')
    }

    const result = await transformHtml2Markdown(url)

    if (result.success && result.data) {
      const output = {
        title: result.data.title,
        author: result.data.author,
        content: result.data.content,
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      }
    } else {
      throw new Error(result.msg || '转换失败')
    }
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('微信文章转 Markdown MCP 服务已启动')
}

main().catch((error) => {
  console.error('服务启动失败:', error)
  process.exit(1)
})
