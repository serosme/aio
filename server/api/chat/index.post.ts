import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  smoothStream,
  streamText,
  toUIMessageStream,
} from 'ai'
import { aiTools } from '../../utils/ai-tools'
import { chatPrompts } from './prompts.get'

export default defineEventHandler(async (event) => {
  const { messages, model, prompt = 'default' } = await readBody(event)
  const { baseUrl, apiKey } = conf.get('chat')
  const selectedPrompt = chatPrompts.find(item => item.value === prompt) ?? chatPrompts[0]

  const provider = createOpenAICompatible({
    name: 'custom',
    baseURL: baseUrl,
    apiKey,
  })

  const result = streamText({
    model: provider(model),
    messages: await convertToModelMessages(messages),
    system: selectedPrompt!.prompt,
    tools: aiTools,
    stopWhen: isStepCount(3),
    experimental_transform: smoothStream({
      delayInMs: 12,
      chunking: new Intl.Segmenter('zh', {
        granularity: 'word',
      }),
    }),
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
})
