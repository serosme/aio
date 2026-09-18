import { tool } from 'ai'
import { z } from 'zod'

export const getTime = tool({
  description: '获取当前的日期和时间。',
  inputSchema: z.object({}),
  execute: async () => {
    const now = new Date()

    return {
      iso: now.toISOString(),
      local: now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    }
  },
})
