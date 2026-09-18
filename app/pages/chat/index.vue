<script setup lang="ts">
import { useChat } from '@ai-sdk/vue'
import shiki from '@comark/nuxt/plugins/shiki'
import { isPartStreaming, isToolStreaming } from '@nuxt/ui/utils/ai'
import { DefaultChatTransport, getToolName, isTextUIPart, isToolUIPart } from 'ai'
import materialThemeLighter from 'shiki/themes/material-theme-lighter.mjs'

const markdownPlugins = [shiki({ themes: { light: materialThemeLighter } })]

const input = ref('')
const model = ref('')
const prompt = ref('')
const models = ref<Array<{ label: string, value: string }>>([])
const prompts = ref<Array<{ label: string, value: string }>>([])

await Promise.all([
  useAsyncData('chat-models', async () => {
    const result = await $fetch<Array<{ label: string, value: string }>>('/api/chat/models')
    models.value = result

    if (!model.value && result.length) {
      model.value = result[0]!.value
    }

    return result
  }),
  useAsyncData('chat-prompts', async () => {
    const result = await $fetch<Array<{ label: string, value: string }>>('/api/chat/prompts')
    prompts.value = result

    if (!prompt.value && result.length) {
      prompt.value = result[0]!.value
    }

    return result
  }),
])

const {
  messages,
  status,
  error,
  sendMessage,
  stop,
  regenerate,
  clearError,
} = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat',
  }),
})

function onNewChat() {
  stop()
  clearError()
  messages.value = []
}

function onSubmit() {
  const text = input.value.trim()

  if (!text) {
    return
  }

  sendMessage({ text }, {
    body: {
      model: model.value,
      prompt: prompt.value,
    },
  })
  input.value = ''
}
</script>

<template>
  <UContainer class="flex h-screen min-h-0 flex-col">
    <div class="mb-8 mt-8 min-h-0 flex-1 overflow-y-auto scrollbar-none">
      <UChatMessages :messages="messages" :status="status">
        <template #content="{ message }">
          <template
            v-for="(part, index) in message.parts"
            :key="`${message.id}-${index}`"
          >
            <p
              v-if="isTextUIPart(part) && message.role === 'user'"
              class="whitespace-pre-wrap"
            >
              {{ part.text }}
            </p>

            <Markdown
              v-else-if="isTextUIPart(part)"
              :value="part.text"
              :streaming="isPartStreaming(part)"
              :plugins="markdownPlugins"
              class="*:first:mt-0 *:last:mb-0"
            />

            <UChatTool
              v-else-if="isToolUIPart(part)"
              :text="getToolName(part)"
              :streaming="isToolStreaming(part)"
            />
          </template>
        </template>
      </UChatMessages>
    </div>

    <div class="mb-8">
      <UChatPrompt
        v-model="input"
        class="w-full"
        :maxrows="12"
        :error="error"
        @submit="onSubmit"
      >
        <template #footer>
          <div class="flex items-center gap-1 ml-auto">
            <USelect
              v-model="prompt"
              :items="prompts"
              color="neutral"
              variant="ghost"
              size="sm"
            />

            <USelect
              v-model="model"
              :items="models"
              color="neutral"
              variant="ghost"
              size="sm"
              square
            />

            <UButton
              type="button"
              icon="i-lucide-plus"
              color="neutral"
              variant="ghost"
              size="sm"
              square
              aria-label="新建对话"
              :disabled="!messages.length"
              @click="onNewChat"
            />

            <UChatPromptSubmit
              :status="status"
              size="sm"
              :disabled="!input.trim()"
              @stop="stop()"
              @reload="regenerate()"
            />
          </div>
        </template>
      </UChatPrompt>
    </div>
  </UContainer>
</template>
