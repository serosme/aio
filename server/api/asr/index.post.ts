import { Buffer } from 'node:buffer'

export default defineEventHandler(async (event) => {
  const { data } = await readBody<{ data?: string }>(event)
  if (!data) {
    throw createError({
      statusCode: 400,
      message: '缺少音频数据',
    })
  }

  const audio = Buffer.from(data, 'base64')
  logger.info('[asr] 识别开始')
  const text = await recognizeAudio(audio)
  return { text }
})
