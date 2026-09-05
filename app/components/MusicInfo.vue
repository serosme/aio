<script setup lang="ts">
interface Props {
  open: boolean
  id: string | number
}
const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

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
</script>

<template>
  <UModal v-model:open="open" :ui="{ content: 'w-[70vw] max-w-none' }">
    <template #content>
      <div class="flex h-[70vh] flex-col p-6">
        <div class="mb-4">
          <span class="text-lg font-medium truncate">{{ filename }}</span>
        </div>
        <pre
          class="flex-1 overflow-auto rounded-md bg-gray-50 p-4 text-xs leading-relaxed"
        >{{ text }}</pre>
      </div>
    </template>
  </UModal>
</template>
