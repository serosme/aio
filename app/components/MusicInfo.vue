<script setup lang="ts">
interface Props {
  open: boolean
  id: string | number
}
const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const toast = useToast()

const open = useModalOpen(props, emit, () => {
  if (props.id)
    load()
})
const info = ref<unknown>(null)

const filename = computed(() => String(props.id))
const text = computed(() => JSON.stringify(info.value, null, 2))

async function load() {
  info.value = await selfFetch('/api/music/info', { params: { id: props.id } })
}

async function copy() {
  await navigator.clipboard.writeText(text.value)
  toast.add({ title: '已复制', color: 'success', duration: 1200 })
}
</script>

<template>
  <UModal v-model:open="open" :ui="{ content: 'w-[70vw] max-w-none' }">
    <template #content>
      <div class="flex h-[70vh] flex-col p-6">
        <div class="mb-4 flex items-center justify-between">
          <span class="text-lg font-medium truncate">{{ filename }}</span>
          <UButton
            icon="i-lucide-copy"
            label="复制"
            size="sm"
            color="neutral"
            variant="soft"
            class="cursor-pointer"
            @click="copy()"
          />
        </div>
        <pre
          class="flex-1 overflow-auto rounded-md bg-gray-50 p-4 text-xs leading-relaxed"
        >{{ text }}</pre>
      </div>
    </template>
  </UModal>
</template>
