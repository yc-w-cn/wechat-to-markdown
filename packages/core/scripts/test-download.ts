/**
 * 微信文章转 Markdown 测试脚本
 *
 * 使用说明:
 * 1. 安装依赖: pnpm install
 * 2. 运行脚本: pnpx tsx scripts/test-download.ts <微信文章URL>
 *
 * 示例:
 * pnpx tsx scripts/test-download.ts https://mp.weixin.qq.com/s/xxxxx
 *
 * 功能说明:
 * - 接收微信文章链接作为参数
 * - 下载文章内容并转换为 Markdown 格式
 * - 将结果保存到当前目录的 markdown 文件中
 */

import transformHtml2Markdown from '../dist/index.js'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('错误: 请提供微信文章链接')
    console.log('使用方法: pnpx tsx scripts/test-download.ts <微信文章URL>')
    process.exit(1)
  }

  const url = args[0]

  console.log('开始下载微信文章...')
  console.log(`链接: ${url}`)

  try {
    const result = await transformHtml2Markdown(url)

    if (result.success && result.data) {
      const { title, author, content } = result.data

      if (!content) {
        console.error('下载失败: 内容为空')
        process.exit(1)
      }

      const safeTitle = title || '未命名文章'
      const filename = `${safeTitle.replace(/[\\/:*?"<>|]/g, '_')}.md`

      console.log('\n下载成功!')
      console.log(`标题: ${safeTitle}`)
      console.log(`作者: ${author || '未知'}`)
      console.log(`文件名: ${filename}`)

      writeFileSync(resolve(process.cwd(), filename), content, 'utf-8')
      console.log(`\n文件已保存到: ${filename}`)
    } else {
      console.error('下载失败:', result.msg || '未知错误')
      process.exit(1)
    }
  } catch (error) {
    console.error('发生错误:', error)
    process.exit(1)
  }
}

main()
