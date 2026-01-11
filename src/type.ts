/**
 * Forked from @ryan-liu/wechat-to-markdown
 * 原作者: Ryan-liu
 * Fork 维护者: yc-w-cn
 */
export interface TurnDownResult {
    success: boolean
    code: number
    data?: {
        title?: string
        author?: string
        content?: string
    }
    msg?: string
}

export const enum Status {
    Success = 200,
    Fail = 400,
}
