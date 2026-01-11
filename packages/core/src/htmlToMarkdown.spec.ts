/**
 * Forked from @ryan-liu/wechat-to-markdown
 * 原作者: Ryan-liu
 * Fork 维护者: yc-w-cn
 */
import { markdownService } from './htmlToMarkdown'

describe('markdownService', () => {
  it('应该正确转换普通文本', () => {
    const html = '<p>hello world</p>'
    const result = markdownService.turndown(html)
    expect(result).toBe('hello world')
  })

  it('应该正确转换链接', () => {
    const html = '<a href="https://example.com">链接</a>'
    const result = markdownService.turndown(html)
    expect(result).toBe('[链接](https://example.com)')
  })

  it('应该正确转换删除线', () => {
    const html = '<s>删除文本</s>'
    const result = markdownService.turndown(html)
    expect(result).toBe('~~删除文本~~')
  })

  it('应该正确转换 del 标签', () => {
    const html = '<del>删除文本</del>'
    const result = markdownService.turndown(html)
    expect(result).toBe('~~删除文本~~')
  })

  it('应该正确转换 strike 标签', () => {
    const html = '<strike>删除文本</strike>'
    const result = markdownService.turndown(html)
    expect(result).toBe('~~删除文本~~')
  })

  it('应该正确转换简单表格', () => {
    const html = '<table><tr><th>标题1</th><th>标题2</th></tr><tr><td>内容1</td><td>内容2</td></tr></table>'
    const result = markdownService.turndown(html)
    expect(result).toContain('| 标题1 | 标题2 |')
    expect(result).toContain('|---|---|')
    expect(result).toContain('| 内容1 | 内容2 |')
  })

  it('应该正确转换图片', () => {
    const html = '<img data-src="https://example.com/image.jpg">'
    const result = markdownService.turndown(html)
    expect(result).toContain('![](https://example.com/image.jpg)')
  })

  it('应该正确转换代码块', () => {
    const html = '<pre><code>const x = 1;</code></pre>'
    const result = markdownService.turndown(html)
    expect(result).toContain('```')
    expect(result).toContain('const x = 1;')
  })

  it('应该正确转换换行符', () => {
    const html = 'line1<br>line2<br>line3'
    const result = markdownService.turndown(html)
    expect(result).toBe('line1\nline2\nline3')
  })
})
