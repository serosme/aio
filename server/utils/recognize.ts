import type { Buffer } from 'node:buffer'

export async function recognizeAudio(audio: Buffer): Promise<string> {
  const key = conf.get('asr').key
  if (!key) {
    throw createError({
      statusCode: 400,
      message: '密钥未找到',
    })
  }

  const base64 = `data:audio/webm;base64,${audio.toString('base64')}`
  const response = await $fetch<{ text: string }>(
    'https://ws-lcd36h8nvhamvqa8.cn-beijing.maas.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: {
        model: 'qwen-audio-3.0-asr-flash',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_audio',
                  input_audio: {
                    data: base64,
                  },
                },
              ],
            },
          ],
        },
        parameters: {
          format: 'webm',
        },
      },
      timeout: 20000,
    },
  )

  const result = response.text
  if (!result) {
    logger.error(response)
    throw createError({
      statusCode: 400,
      message: '识别失败',
    })
  }

  return result
}
