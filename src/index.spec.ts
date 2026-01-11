/**
 * Forked from @ryan-liu/wechat-to-markdown
 * 原作者: Ryan-liu
 * Fork 维护者: yc-w-cn
 */
import transformHtml2Markdown, { TurnDownResult, Status } from './index'
import axios from 'axios'
import * as cheerio from 'cheerio'

jest.mock('axios')
jest.mock('cheerio')

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedCheerio = cheerio as jest.Mocked<typeof cheerio>

describe('transformHtml2Markdown', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应该成功转换微信文章为 markdown', async () => {
    const mockHtml = `
      <div id="activity-name">测试标题</div>
      <div class="original_primary_nickname">测试作者</div>
      <div id="js_content">
        <p>测试内容</p>
      </div>
    `

    mockedCheerio.load.mockReturnValue({
      '#activity-name': {
        text: () => '测试标题',
      },
      '.original_primary_nickname': {
        text: () => '测试作者',
      },
      '#js_content': {
        html: () => '<p>测试内容</p>',
      },
    } as any)

    mockedAxios.request.mockResolvedValue({
      data: mockHtml,
    } as any)

    const result = await transformHtml2Markdown('https://mp.weixin.qq.com/s/test')

    expect(result.success).toBe(true)
    expect(result.code).toBe(Status.Success)
    expect(result.data?.title).toBe('测试标题')
    expect(result.data?.author).toBe('测试作者')
    expect(result.data?.content).toContain('## 测试标题')
    expect(result.data?.content).toContain('## 作者 测试作者')
  })

  it('应该处理空内容的情况', async () => {
    const mockHtml = `
      <div id="activity-name"></div>
      <div class="original_primary_nickname"></div>
      <div id="js_content"></div>
    `

    mockedCheerio.load.mockReturnValue({
      '#activity-name': {
        text: () => '',
      },
      '.original_primary_nickname': {
        text: () => '',
      },
      '#js_content': {
        html: () => '',
      },
    } as any)

    mockedAxios.request.mockResolvedValue({
      data: mockHtml,
    } as any)

    const result = await transformHtml2Markdown('https://mp.weixin.qq.com/s/test')

    expect(result.success).toBe(false)
    expect(result.code).toBe(Status.Fail)
    expect(result.msg).toBe('内容解析失败')
  })

  it('应该处理网络错误', async () => {
    const mockError = new Error('网络错误')
    mockedAxios.request.mockRejectedValue(mockError)

    const result = await transformHtml2Markdown('https://mp.weixin.qq.com/s/test')

    expect(result).toEqual(mockError)
  })

  it('应该调用 axios 请求', async () => {
    mockedCheerio.load.mockReturnValue({
      '#activity-name': { text: () => '' },
      '.original_primary_nickname': { text: () => '' },
      '#js_content': { html: () => '' },
    } as any)

    mockedAxios.request.mockResolvedValue({
      data: '',
    } as any)

    await transformHtml2Markdown('https://mp.weixin.qq.com/s/test')

    expect(mockedAxios.request).toHaveBeenCalledWith({
      url: 'https://mp.weixin.qq.com/s/test',
      method: 'get',
      timeout: 30000,
      transformResponse: expect.any(Function),
    })
  })
})
