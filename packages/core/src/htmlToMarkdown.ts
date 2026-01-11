/**
 * Forked from @ryan-liu/wechat-to-markdown
 * 原作者: Ryan-liu
 * Fork 维护者: yc-w-cn
 */
/**
 *  html 转换 markdown 格式
 */
import turnDownService from 'turndown'
import { formatCode, figure2markdown } from './formatHtml'

const markdownService = new turnDownService({
  codeBlockStyle: 'fenced',
  hr: '',
})

// 自定义配置
markdownService
  .addRule('pre2Code', {
    filter: ['pre'],
    replacement(content, node: any) {
      const len = content.length
      // 微信文章获取到的 content， 会出现首尾都有 '`'
      const isCode = content[0] === '`' && content[len - 1] === '`'

      let pre_Markdown = ''

      if (isCode) {
        pre_Markdown = formatCode(node.innerHTML)
      }

      const res = isCode ? pre_Markdown : content

      return '```\n' + res + '\n```\n'
    },
  })
  .addRule('getImage', {
    filter: ['img'],
    replacement(content, node: any) {
      const src = node.getAttribute('data-src') || ''

      return src ? `\n\n ![](${src}) \n\n` : ''
    },
  })
  .addRule('lineBreaks', {
    filter: 'br',
    replacement: () => '\n',
  })
  .addRule('img2Code', {
    filter: ['figure'],
    replacement(content, node: any) {
      const res = figure2markdown(node.innerHTML)
      return res || ''
    },
  })
  .addRule('strikethrough', {
    filter: ['s', 'del', 'strike'],
    replacement(content) {
      return `~~${content}~~`
    },
  })
  .addRule('table', {
    filter: ['table'],
    replacement(content, node: any) {
      const rows = Array.from(node.querySelectorAll('tr'))
      if (rows.length === 0) return ''

      let markdown = '\n'

      rows.forEach((row: any) => {
        const cells = Array.from(row.querySelectorAll('td, th'))
        markdown += '| ' + cells.map((cell: any) => cell.textContent?.trim() || '').join(' | ') + ' |\n'
      })

      // 添加表头分隔线
      const headerCells = Array.from((rows[0] as any).querySelectorAll('th'))
      if (headerCells.length > 0) {
        markdown += '| ' + headerCells.map(() => '---').join(' | ') + ' |\n'
      }

      return markdown
    },
  })

export { markdownService }
