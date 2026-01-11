/**
 * Forked from @ryan-liu/wechat-to-markdown
 * 原作者: Ryan-liu
 * Fork 维护者: yc-w-cn
 */
import { formatCode, figure2markdown } from './formatHtml'

describe('formatCode', () => {
  it('应该替换 br 标签为换行符', () => {
    const html = 'line1<br>line2'
    const result = formatCode(html)
    expect(result).toBe('line1\nline2')
  })

  it('应该替换 HTML 实体字符', () => {
    const html = '&lt;&gt;&amp;&quot;&apos;&times;&divide;'
    const result = formatCode(html)
    expect(result).toBe('<>&"\'*%')
  })

  it('应该替换 nbsp 为空格', () => {
    const html = 'hello&nbsp;world'
    const result = formatCode(html)
    expect(result).toBe('hello world')
  })
})

describe('figure2markdown', () => {
  it('应该正确转换带图片和描述的 figure', () => {
    const html = '<img data-src="https://example.com/image.jpg" alt="图片描述">'
    const result = figure2markdown(html)
    expect(result).toBe('\n\n ![图片描述](https://example.com/image.jpg) \n\n')
  })

  it('应该正确转换不带图片的 figure', () => {
    const html = '<p>没有图片</p>'
    const result = figure2markdown(html)
    expect(result).toBeUndefined()
  })

  it('应该处理空字符串', () => {
    const html = ''
    const result = figure2markdown(html)
    expect(result).toBeUndefined()
  })
})
