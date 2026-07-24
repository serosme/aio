<script setup lang="ts">
const status = ref<'idle' | 'recording' | 'processing'>('idle')
const statusText = computed(() =>
  ({ idle: '等待中', recording: '录音中', processing: '识别中' })[status.value],
)
const { finished, start, stop, result } = useSpeechRecognition()

onMounted(() => {
  window.electronAPI.asr.onStart(() => {
    status.value = 'recording'
    start()
  })
  window.electronAPI.asr.onEnd(() => {
    status.value = 'processing'
    stop()
  })
})

watch(finished, (val) => {
  if (!val)
    return
  if (result.value) {
    window.electronAPI.asr.sendResult(result.value)
  }
  status.value = 'idle'
  finished.value = false
})
</script>

<template>
  <div class="p-4 text-sm">
    {{ statusText }}
  </div>
</template>
