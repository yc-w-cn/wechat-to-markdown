# MCP TypeScript SDK

The Model Context Protocol (MCP) TypeScript SDK provides a standardized way for applications to expose contextual data, tools, and prompts to Large Language Models. This implementation enables developers to build MCP servers that provide resources and capabilities, as well as MCP clients that consume them. The SDK abstracts the complexity of the JSON-RPC protocol and offers both high-level and low-level APIs for maximum flexibility.

The SDK supports multiple transport mechanisms including stdio for local process communication, Streamable HTTP for remote server deployment, WebSocket for browser-based clients, and SSE for legacy compatibility. It includes built-in support for OAuth authentication, session management, argument completion, structured output validation, and user input elicitation. Whether building a simple tool server or a complex multi-resource system with stateful sessions, the SDK provides the necessary building blocks with type safety and automatic protocol compliance.

## Creating a Basic MCP Server with Tools

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import express from 'express'
import * as z from 'zod'

const server = new McpServer({
  name: 'calculator-server',
  version: '1.0.0',
})

// Register a tool with input and output schemas using the new API
server.registerTool(
  'add',
  {
    title: 'Addition Tool',
    description: 'Add two numbers together',
    inputSchema: {
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
    },
    outputSchema: {
      result: z.number(),
      operation: z.string(),
    },
  },
  async ({ a, b }) => {
    const output = { result: a + b, operation: 'addition' }
    return {
      content: [{ type: 'text', text: JSON.stringify(output) }],
      structuredContent: output,
    }
  }
)

// Setup HTTP transport
const app = express()
app.use(express.json())

app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  res.on('close', () => transport.close())
  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

app.listen(3000, () => {
  console.log('MCP Server running on http://localhost:3000/mcp')
})
```

## Registering Dynamic Resources with Templates

```typescript
import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod'

const server = new McpServer({
  name: 'data-server',
  version: '1.0.0',
})

// Static resource with fixed URI
server.registerResource(
  'config',
  'app://configuration',
  {
    title: 'Application Configuration',
    description: 'Global app configuration',
    mimeType: 'application/json',
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify({ theme: 'dark', language: 'en' }),
      },
    ],
  })
)

// Dynamic resource template with parameters
server.registerResource(
  'user-profile',
  new ResourceTemplate('users://{userId}/profile', { list: undefined }),
  {
    title: 'User Profile',
    description: 'Dynamic user profile data',
  },
  async (uri, { userId }) => {
    const userData = { id: userId, name: `User ${userId}`, role: 'developer' }
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(userData),
        },
      ],
    }
  }
)

// Resource with context-aware completion
server.registerResource(
  'repository',
  new ResourceTemplate('github://repos/{owner}/{repo}', {
    list: undefined,
    complete: {
      owner: (value) => {
        return ['microsoft', 'google', 'facebook'].filter((o) =>
          o.startsWith(value)
        )
      },
      repo: (value, context) => {
        const owner = context?.arguments?.['owner']
        if (owner === 'microsoft') {
          return ['vscode', 'typescript', 'playwright'].filter((r) =>
            r.startsWith(value)
          )
        }
        return ['repo1', 'repo2'].filter((r) => r.startsWith(value))
      },
    },
  }),
  {
    title: 'GitHub Repository',
    description: 'Repository data from GitHub',
  },
  async (uri, { owner, repo }) => ({
    contents: [
      {
        uri: uri.href,
        text: `Repository: ${owner}/${repo}`,
      },
    ],
  })
)
```

## Creating Prompts with Argument Completion

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { completable } from '@modelcontextprotocol/sdk/server/completable.js'
import * as z from 'zod'

const server = new McpServer({
  name: 'prompt-server',
  version: '1.0.0',
})

// Simple prompt with arguments
server.registerPrompt(
  'review-code',
  {
    title: 'Code Review',
    description: 'Review code for best practices',
    argsSchema: {
      code: z.string().describe('Code to review'),
    },
  },
  ({ code }) => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Please review this code:\n\n${code}\n\nProvide feedback on style, performance, and best practices.`,
        },
      },
    ],
  })
)

// Prompt with context-aware argument completion
server.registerPrompt(
  'team-greeting',
  {
    title: 'Team Greeting Generator',
    description: 'Generate personalized team greetings',
    argsSchema: {
      department: completable(
        z.string().describe('Department name'),
        (value) => {
          return ['engineering', 'sales', 'marketing', 'support'].filter((d) =>
            d.startsWith(value)
          )
        }
      ),
      name: completable(
        z.string().describe('Team member name'),
        (value, context) => {
          const dept = context?.arguments?.['department']
          const names: Record<string, string[]> = {
            engineering: ['Alice', 'Bob', 'Charlie'],
            sales: ['David', 'Eve', 'Frank'],
            marketing: ['Grace', 'Henry', 'Iris'],
          }
          return (names[dept] || ['Guest']).filter((n) => n.startsWith(value))
        }
      ),
    },
  },
  ({ department, name }) => ({
    messages: [
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `Hello ${name}! Welcome to the ${department} team. We're excited to have you aboard!`,
        },
      },
    ],
  })
)
```

## Using LLM Sampling in Server Tools

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod'

const server = new McpServer({
  name: 'sampling-server',
  version: '1.0.0',
})

// Tool that uses LLM sampling to process data
server.registerTool(
  'summarize-text',
  {
    title: 'Text Summarizer',
    description: 'Summarize long text using LLM',
    inputSchema: {
      text: z.string().describe('Text to summarize'),
      maxWords: z.number().optional().describe('Maximum words in summary'),
    },
    outputSchema: {
      summary: z.string(),
      wordCount: z.number(),
    },
  },
  async ({ text, maxWords = 100 }) => {
    // Request LLM completion from connected client
    const response = await server.server.createMessage({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Summarize the following text in no more than ${maxWords} words:\n\n${text}`,
          },
        },
      ],
      maxTokens: 500,
    })

    const summary =
      response.content.type === 'text' ? response.content.text : ''
    const wordCount = summary.split(/\s+/).length
    const output = { summary, wordCount }

    return {
      content: [{ type: 'text', text: JSON.stringify(output) }],
      structuredContent: output,
    }
  }
)
```

## Building an MCP Client

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const client = new Client({
  name: 'my-client',
  version: '1.0.0',
})

// Connect to server
const transport = new StreamableHTTPClientTransport(
  new URL('http://localhost:3000/mcp')
)
await client.connect(transport)

// List available tools
const toolsList = await client.listTools()
console.log(
  'Available tools:',
  toolsList.tools.map((t) => t.name)
)

// Call a tool
const result = await client.callTool({
  name: 'add',
  arguments: { a: 5, b: 3 },
})
console.log('Tool result:', result.content[0].text)
console.log('Structured output:', result.structuredContent)

// List and read resources
const resources = await client.listResources()
console.log(
  'Available resources:',
  resources.resources.map((r) => r.uri)
)

const resourceData = await client.readResource({
  uri: 'app://configuration',
})
console.log('Resource content:', resourceData.contents[0].text)

// Get prompts
const prompts = await client.listPrompts()
const prompt = await client.getPrompt({
  name: 'review-code',
  arguments: { code: 'function add(a, b) { return a + b; }' },
})
console.log('Prompt message:', prompt.messages[0].content.text)

// Request argument completion
const completions = await client.complete({
  ref: { type: 'ref/prompt', name: 'team-greeting' },
  argument: { name: 'department', value: 'eng' },
  context: { arguments: {} },
})
console.log('Suggestions:', completions.completion.values)

await client.close()
```

## Stdio Transport for Local Processes

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import * as z from 'zod'

const server = new McpServer({
  name: 'stdio-server',
  version: '1.0.0',
})

server.registerTool(
  'get-time',
  {
    title: 'Get Current Time',
    description: 'Returns the current timestamp',
    inputSchema: {},
    outputSchema: {
      timestamp: z.string(),
      timezone: z.string(),
    },
  },
  async () => {
    const output = {
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
    return {
      content: [{ type: 'text', text: JSON.stringify(output) }],
      structuredContent: output,
    }
  }
)

// Connect via stdio (for spawned processes)
const transport = new StdioServerTransport()
await server.connect(transport)
```

## Client with Stdio Transport

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const client = new Client({
  name: 'stdio-client',
  version: '1.0.0',
})

// Spawn server process and connect via stdio
const transport = new StdioClientTransport({
  command: 'node',
  args: ['server.js'],
})

await client.connect(transport)

const result = await client.callTool({
  name: 'get-time',
  arguments: {},
})
console.log('Server time:', result.structuredContent)

await client.close()
```

## WebSocket Transport for Browser Clients

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js'

const client = new Client({
  name: 'websocket-client',
  version: '1.0.0',
})

// Connect to WebSocket server
const transport = new WebSocketClientTransport(
  new URL('ws://localhost:3000/mcp')
)

await client.connect(transport)

// Use client methods normally
const tools = await client.listTools()
console.log(
  'Available tools:',
  tools.tools.map((t) => t.name)
)

const result = await client.callTool({
  name: 'echo',
  arguments: { message: 'Hello from browser!' },
})
console.log('Response:', result.content[0].text)

await client.close()
```

## Session Management with Streamable HTTP

```typescript
import express from 'express'
import { randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'

const app = express()
app.use(express.json())

const transports: Record<string, StreamableHTTPServerTransport> = {}

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined
  let transport: StreamableHTTPServerTransport

  if (sessionId && transports[sessionId]) {
    // Reuse existing session
    transport = transports[sessionId]
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New session initialization
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        transports[id] = transport
        console.log('Session initialized:', id)
      },
      onsessionclosed: (id) => {
        delete transports[id]
        console.log('Session closed:', id)
      },
    })

    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId]
      }
    }

    const server = new McpServer({ name: 'session-server', version: '1.0.0' })
    // ... register tools, resources, prompts
    await server.connect(transport)
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Invalid session' },
      id: null,
    })
    return
  }

  await transport.handleRequest(req, res, req.body)
})

app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string
  const transport = transports[sessionId]
  if (transport) {
    await transport.handleRequest(req, res)
  } else {
    res.status(400).send('Invalid session')
  }
})

app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string
  const transport = transports[sessionId]
  if (transport) {
    await transport.handleRequest(req, res)
  } else {
    res.status(400).send('Invalid session')
  }
})

app.listen(3000)
```

## Dynamic Server with Mutable Tools

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod'

const server = new McpServer({
  name: 'dynamic-server',
  version: '1.0.0',
})

const readTool = server.registerTool(
  'read-file',
  {
    title: 'Read File',
    description: 'Read file contents',
    inputSchema: { path: z.string() },
    outputSchema: { content: z.string() },
  },
  async ({ path }) => {
    const content = `Contents of ${path}`
    const output = { content }
    return {
      content: [{ type: 'text', text: JSON.stringify(output) }],
      structuredContent: output,
    }
  }
)

const writeTool = server.registerTool(
  'write-file',
  {
    title: 'Write File',
    description: 'Write to file',
    inputSchema: { path: z.string(), content: z.string() },
    outputSchema: { success: z.boolean() },
  },
  async ({ path, content }) => {
    const output = { success: true }
    return {
      content: [{ type: 'text', text: JSON.stringify(output) }],
      structuredContent: output,
    }
  }
)

// Initially disable write tool
writeTool.disable()

const upgradeTool = server.registerTool(
  'upgrade-permissions',
  {
    title: 'Upgrade Permissions',
    description: 'Upgrade to write access',
    inputSchema: { level: z.enum(['write', 'admin']) },
    outputSchema: { success: z.boolean(), newLevel: z.string() },
  },
  async ({ level }) => {
    // Enable write tool when upgrading
    writeTool.enable() // Automatically triggers notifications/tools/list_changed

    if (level === 'admin') {
      // Remove upgrade tool when reaching admin
      upgradeTool.remove() // Triggers notification again
    } else {
      // Update schema to only allow admin upgrade
      upgradeTool.update({
        inputSchema: { level: z.enum(['admin']) },
      })
    }

    const output = { success: true, newLevel: level }
    return {
      content: [{ type: 'text', text: JSON.stringify(output) }],
      structuredContent: output,
    }
  }
)
```

## Low-Level Server API

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js'

const server = new Server(
  { name: 'low-level-server', version: '1.0.0' },
  { capabilities: { tools: { listChanged: true } } }
)

// Manually handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'multiply',
        description: 'Multiply two numbers',
        inputSchema: {
          type: 'object',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' },
          },
          required: ['a', 'b'],
        },
      },
    ],
  }
})

// Manually handle tool calls
server.setRequestHandler(
  CallToolRequestSchema,
  async (request): Promise<CallToolResult> => {
    if (request.params.name === 'multiply') {
      const { a, b } = request.params.arguments as { a: number; b: number }
      const result = a * b
      return {
        content: [
          {
            type: 'text',
            text: `Result: ${result}`,
          },
        ],
      }
    }
    throw new Error('Unknown tool')
  }
)

const transport = new StdioServerTransport()
await server.connect(transport)
```

## OAuth Authentication with Proxy Provider

```typescript
import express from 'express'
import { ProxyOAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/providers/proxyProvider.js'
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js'

const app = express()

const proxyProvider = new ProxyOAuthServerProvider({
  endpoints: {
    authorizationUrl: 'https://auth.external.com/oauth2/v1/authorize',
    tokenUrl: 'https://auth.external.com/oauth2/v1/token',
    revocationUrl: 'https://auth.external.com/oauth2/v1/revoke',
  },
  verifyAccessToken: async (token) => {
    // Validate token with external provider
    return {
      token,
      clientId: 'client-123',
      scopes: ['openid', 'email', 'profile'],
    }
  },
  getClient: async (clientId) => {
    // Retrieve client configuration
    return {
      client_id: clientId,
      redirect_uris: ['http://localhost:3000/callback'],
      grant_types: ['authorization_code', 'refresh_token'],
    }
  },
})

app.use(
  mcpAuthRouter({
    provider: proxyProvider,
    issuerUrl: new URL('https://auth.external.com'),
    baseUrl: new URL('https://mcp.example.com'),
    serviceDocumentationUrl: new URL('https://docs.example.com/'),
  })
)

app.listen(3000)
```

## Eliciting User Input from Server

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod'

const server = new McpServer({
  name: 'interactive-server',
  version: '1.0.0',
})

server.registerTool(
  'book-restaurant',
  {
    title: 'Book Restaurant',
    description: 'Make a restaurant reservation',
    inputSchema: {
      restaurant: z.string(),
      date: z.string(),
      partySize: z.number(),
    },
    outputSchema: {
      success: z.boolean(),
      booking: z
        .object({
          restaurant: z.string(),
          date: z.string(),
          confirmationCode: z.string(),
        })
        .optional(),
      alternatives: z.array(z.string()).optional(),
    },
  },
  async ({ restaurant, date, partySize }) => {
    const available = Math.random() > 0.5 // Simulate availability check

    if (!available) {
      // Ask user for alternatives
      const result = await server.server.elicitInput({
        message: `No tables available at ${restaurant} on ${date}. Check alternative dates?`,
        requestedSchema: {
          type: 'object',
          properties: {
            checkAlternatives: {
              type: 'boolean',
              title: 'Check alternative dates',
              description: 'Would you like to check other dates?',
            },
            flexibility: {
              type: 'string',
              title: 'Date flexibility',
              enum: ['next_day', 'same_week', 'next_week'],
              enumNames: ['Next day only', 'Same week', 'Next week'],
            },
          },
          required: ['checkAlternatives'],
        },
      })

      if (result.action === 'accept' && result.content?.checkAlternatives) {
        const alternatives = ['2024-12-20', '2024-12-21', '2024-12-22']
        const output = { success: false, alternatives }
        return {
          content: [{ type: 'text', text: JSON.stringify(output) }],
          structuredContent: output,
        }
      }

      const output = { success: false }
      return {
        content: [{ type: 'text', text: JSON.stringify(output) }],
        structuredContent: output,
      }
    }

    const booking = {
      restaurant,
      date,
      confirmationCode:
        'ABC-' + Math.random().toString(36).substring(7).toUpperCase(),
    }
    const output = { success: true, booking }

    return {
      content: [{ type: 'text', text: JSON.stringify(output) }],
      structuredContent: output,
    }
  }
)
```

## Client Handling Elicitation Requests

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { ElicitRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const client = new Client({
  name: 'interactive-client',
  version: '1.0.0',
})

// Handle server elicitation requests
client.setRequestHandler(ElicitRequestSchema, async (request) => {
  const rl = readline.createInterface({ input, output })

  console.log('\nServer is asking for input:')
  console.log(request.params.message)

  const answer = await rl.question('Continue? (yes/no): ')
  rl.close()

  if (answer.toLowerCase() === 'yes') {
    return {
      action: 'accept',
      content: {
        checkAlternatives: true,
        flexibility: 'same_week',
      },
    }
  } else {
    return { action: 'decline' }
  }
})
```

## Configurable JSON Schema Validation

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv'
import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/cfworker'

// Using AJV validator (Node.js - default)
const nodeClient = new Client(
  { name: 'node-client', version: '1.0.0' },
  {
    capabilities: {},
    jsonSchemaValidator: new AjvJsonSchemaValidator(),
  }
)

// Using Cloudflare Worker validator (Edge runtimes)
const edgeClient = new Client(
  { name: 'edge-client', version: '1.0.0' },
  {
    capabilities: {},
    jsonSchemaValidator: new CfWorkerJsonSchemaValidator(),
  }
)
```

The MCP TypeScript SDK provides a comprehensive foundation for building context-aware AI applications. The high-level `McpServer` and `Client` classes simplify common use cases with automatic protocol handling, schema validation, and type safety. For advanced scenarios, the low-level `Server` and transport APIs offer fine-grained control over message handling and connection management.

Integration patterns include local process communication via stdio for development and desktop applications, Streamable HTTP for production web services with session management, WebSocket for browser-based clients, and OAuth authentication for secure multi-user environments. The SDK's support for dynamic capabilities, argument completion, structured outputs, user elicitation, and configurable validation enables sophisticated interactive workflows between LLMs and external systems.
