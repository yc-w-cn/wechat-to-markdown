/**
 * Forked from @ryan-liu/wechat-to-markdown
 * 原作者: Ryan-liu
 * Fork 维护者: yc-w-cn
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import { errObj } from './error'
import { TurnDownResult, Status } from './type'
import { markdownService } from './htmlToMarkdown'

const getError = (code: number) => {
  return {
    code,
    success: false,
    msg: errObj[code],
  }
}

export { TurnDownResult, Status }

export default async function transformHtml2Markdown(
  url: string
): Promise<TurnDownResult> {
  const json: TurnDownResult = await axios
    .request({
      url,
      method: 'get',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      transformResponse(res) {
        return res
      },
    })
    .then((res) => {
      const $ = cheerio.load(res['data'])

      let title = $('#activity-name').text()

      title = title.trim() || ''

      const author = $('.original_primary_nickname').text()

      const html = $('#js_content').html()

      if (html && html.length > 0) {
        let res = markdownService.turndown(html)

        res = `## ${title} \n \n` + `## 作者 ${author} \n \n` + res

        return {
          success: true,
          code: Status.Success,
          data: {
            title,
            author,
            content: res,
          },
        }
      }

      return getError(Status.Fail)
    })
    .catch((err) => {
      console.log(err)
      return err
    })

  return json
}
