<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'

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
    const match = line.match(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\](.*)/)
    if (!match)
      return []
    const [, m, s, ms, text] = match
    if (!text)
      return []
    const time = Number(m) * 60 + Number(s) + Number(ms ? Number(ms) / 10 ** ms.length : 0)
    return [{ time, text: text.trim() }]
  }).sort((a, b) => a.time - b.time)
}

const lines = computed<LyricLine[]>(() => parseLrc(props.text))

const activeIndex = computed(() => {
  let i = -1
  for (const [j, line] of lines.value.entries()) {
    if (line.time > props.currentTime)
      break
    i = j
  }
  return i
})

const LINE_HEIGHT = 40
const containerEl = useTemplateRef<HTMLElement>('container')
const containerHeight = ref(0)
useResizeObserver(containerEl, ([entry]) => {
  containerHeight.value = entry?.contentRect.height || 0
})

const translateY = computed(() => {
  if (!lines.value.length)
    return 0
  const index = Math.max(activeIndex.value, 0)
  return containerHeight.value / 2 - (index + 0.5) * LINE_HEIGHT
})
</script>

<template>
  <div
    ref="container"
    class="relative h-full w-full overflow-hidden"
    :style="{ maskImage: 'linear-gradient(to bottom, transparent 0, black 15%, black 85%, transparent 100%)' }"
  >
    <div
      v-if="lines.length"
      class="transition-transform duration-300 will-change-transform"
      :style="{ transform: `translateY(${translateY}px)` }"
    >
      <div
        v-for="(line, index) in lines"
        :key="index"
        class="flex h-10 items-center justify-center px-6 text-lg leading-relaxed truncate transition-colors duration-300"
        :class="index === activeIndex ? 'text-primary font-medium' : 'text-gray-400'"
      >
        {{ line.text }}
      </div>
    </div>
    <p v-if="!lines.length" class="p-6 text-sm text-gray-400">
      暂无歌词
    </p>
  </div>
</template>
