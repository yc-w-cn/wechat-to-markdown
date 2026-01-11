/**
 * Forked from @ryan-liu/wechat-to-markdown
 * 原作者: Ryan-liu
 * Fork 维护者: yc-w-cn
 */
import { TurnDownResult, Status } from './type'

describe('TurnDownResult 接口', () => {
  it('应该定义正确的类型结构', () => {
    const result: TurnDownResult = {
      success: true,
      code: 200,
      data: {
        title: '测试标题',
        author: '测试作者',
        content: '测试内容',
      },
      msg: '成功',
    }
    expect(result.success).toBe(true)
    expect(result.code).toBe(200)
    expect(result.data?.title).toBe('测试标题')
  })

  it('应该允许 data 为可选', () => {
    const result: TurnDownResult = {
      success: false,
      code: 400,
      msg: '失败',
    }
    expect(result.data).toBeUndefined()
  })
})

describe('Status 枚举', () => {
  it('应该定义正确的状态码', () => {
    expect(Status.Success).toBe(200)
    expect(Status.Fail).toBe(400)
  })

  it('应该是数字类型', () => {
    expect(typeof Status.Success).toBe('number')
    expect(typeof Status.Fail).toBe('number')
  })
})
