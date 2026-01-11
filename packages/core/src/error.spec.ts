/**
 * Forked from @ryan-liu/wechat-to-markdown
 * 原作者: Ryan-liu
 * Fork 维护者: yc-w-cn
 */
import { errObj } from './error'

describe('errObj', () => {
  it('应该返回正确的错误信息', () => {
    expect(errObj[400]).toBe('内容解析失败')
  })

  it('应该不包含未定义的错误码', () => {
    expect(errObj[500]).toBeUndefined()
  })
})
