<script setup lang="ts">
interface Props {
  open: boolean
  id: string | number
}
const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()
const toast = useToast()

const open = useModalOpen(props, emit, () => {
  if (props.id)
    loadTags()
})
const tags = ref({ title: '', artist: '', album: '', lyrics: '' })
const saving = ref(false)

const filename = computed(() => String(props.id))

async function loadTags() {
  tags.value = await selfFetch('/api/music/tags', { params: { id: props.id } })
}

async function onSubmit() {
  saving.value = true
  try {
    await selfFetch('/api/music/tags', {
      method: 'PUT',
      params: { id: props.id },
      body: tags.value,
    })
    toast.add({ title: '成功', color: 'success', duration: 1200 })
    open.value = false
    emit('saved')
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" :ui="{ content: 'w-[70vw] max-w-none' }">
    <template #content>
      <div class="p-6 h-[70vh] overflow-y-auto">
        <UForm allow-tab :state="tags" @submit="onSubmit">
          <div class="flex flex-col gap-4">
            <UFormField label="文件名">
              <UInput :value="filename" class="w-full" readonly />
            </UFormField>
            <UFormField label="标题">
              <UInput v-model="tags.title" class="w-full" />
            </UFormField>
            <UFormField label="音乐人">
              <UInput v-model="tags.artist" class="w-full" />
            </UFormField>
            <UFormField label="专辑">
              <UInput v-model="tags.album" class="w-full" />
            </UFormField>
            <UFormField label="歌词">
              <UTextarea v-model="tags.lyrics" class="w-full" :rows="12" />
            </UFormField>
            <UButton
              label="保存"
              type="submit"
              :loading="saving"
              class="cursor-pointer w-fit"
            />
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
