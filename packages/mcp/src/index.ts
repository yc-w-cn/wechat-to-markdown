/**
 * Forked from @ryan-liu/wechat-to-markdown
 * 原作者: Ryan-liu
 * Fork 维护者: yc-w-cn
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import transformHtml2Markdown from '@yc-w-cn/wechat-to-markdown-core'

const server = new Server(
  {
    name: 'wechat-to-markdown-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'transform_wechat_url_to_markdown',
        description: '将微信公众号文章 URL 转换为 Markdown 格式',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: '微信公众号文章的 URL 地址',
            },
          },
          required: ['url'],
        },
      },
    ],
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  if (name === 'transform_wechat_url_to_markdown') {
    const { url } = args as { url: string }

    if (!url) {
      throw new Error('URL 参数不能为空')
    }

    try {
      const result = await transformHtml2Markdown(url)

      if (result.success && result.data) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  title: result.data.title,
                  author: result.data.author,
                  content: result.data.content,
                },
                null,
                2
              ),
            },
          ],
        }
      } else {
        throw new Error(result.msg || '转换失败')
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `转换失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      }
    }
  }

  throw new Error(`未知的工具: ${name}`)
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('微信文章转 Markdown MCP 服务已启动')
}

main().catch((error) => {
  console.error('服务启动失败:', error)
  process.exit(1)
})
