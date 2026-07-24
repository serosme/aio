export default defineEventHandler(async (event): Promise<string> => {
  const { base64 } = await readBody<{ base64: string }>(event)

  const key = conf.get('asr').key
  if (!key) {
    throw createError({
      message: '密钥未找到',
    })
  }

  const response = await $fetch<{ choices: { message: { content: string } }[] }>(
    'https://api.xiaomimimo.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: {
        model: 'mimo-v2.5-asr',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'input_audio',
                input_audio: { data: base64 },
              },
            ],
          },
        ],
        asr_options: {
          language: 'zh',
        },
      },
    },
  )

  const choice = response.choices[0]
  if (!choice?.message?.content) {
    throw createError({
      message: '识别失败',
    })
  }

  return choice.message.content
})
