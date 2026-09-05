import { Buffer } from 'node:buffer'

const maxAudioBytes = 8 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const { audio } = await readBody<{ audio?: unknown }>(event)
  if (typeof audio !== 'string' || !audio) {
    throw createError({
      statusCode: 400,
      message: '无效音频',
    })
  }

  const decoded = Buffer.from(audio, 'base64')
  if (!decoded.length || decoded.length > maxAudioBytes) {
    throw createError({
      statusCode: 400,
      message: '音频过大或为空',
    })
  }

  const text = await recognizeAudio(decoded)
  return { text }
})
