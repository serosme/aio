<script setup lang="ts">
interface LyricLine {
  time: number
  text: string
}

interface Props {
  text: string
  currentTime: number
}
const props = defineProps<Props>()

function parseLrc(raw: string): LyricLine[] {
  return raw.split(/\r?\n/).flatMap((line) => {
    const matches = [...line.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)]
    const text = line.replace(/^\s*(?:\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]\s*)+/, '').trim()
    if (!matches.length || !text)
      return []
    return matches.map(([, m, s, ms]) => ({
      time: Number(m) * 60 + Number(s) + (ms ? Number(ms) / 10 ** ms.length : 0),
      text,
    }))
  }).sort((a, b) => a.time - b.time)
}

const lines = computed<LyricLine[]>(() => parseLrc(props.text))

// 歌词提前量（秒）：补偿 timeupdate 事件间隔与平滑滚动动画的感知延迟
const LYRIC_OFFSET = 0.1

const activeIndex = computed(() =>
  lines.value.findLastIndex(line => line.time <= props.currentTime + LYRIC_OFFSET),
)

const scrollArea = useTemplateRef('scrollArea')

watch([activeIndex, lines], ([index]) => {
  scrollArea.value?.virtualizer?.scrollToIndex(Math.max(index, 0), { align: 'center', behavior: 'smooth' })
}, { immediate: true, flush: 'post' })
</script>

<template>
  <UScrollArea
    v-if="lines.length"
    ref="scrollArea"
    class="h-full w-full select-none overflow-hidden!"
    :items="lines"
    shadow
    :virtualize="{ estimateSize: 40, skipMeasurement: true }"
  >
    <template #default="{ item, index }">
      <div
        class="flex h-10 items-center justify-center px-6 text-lg leading-relaxed truncate transition-colors duration-300"
        :class="index === activeIndex ? 'text-primary font-medium' : 'text-gray-400'"
      >
        {{ item.text }}
      </div>
    </template>
  </UScrollArea>
  <p v-else class="p-6 text-sm text-gray-400">
    暂无歌词
  </p>
</template>
