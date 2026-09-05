<script setup lang="ts">
import type { DropdownMenuItem, TableColumn, TableRow } from '@nuxt/ui'

const edit = ref({ open: false, id: '' })
const info = ref({ open: false, id: '' })
const toast = useToast()
const coverError = ref(false)

const {
  musics,
  current,
  cover,
  lyrics,
  load,
  playAt,
  next,
  prev,
  togglePlay,
  currentTime,
  duration,
  displayVolume,
  muted,
  shuffle,
  repeat,
  wantPlay,
} = useMusic()

watch(cover, () => {
  coverError.value = false
})

function formatTime(seconds: number): string {
  const total = Math.round(seconds)
  const minutes = Math.floor(total / 60)
  const secs = total % 60

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

type SliderValue = number | number[]

const currentTimeSlider = computed<SliderValue>({
  get: () => currentTime.value,
  set: (value) => {
    currentTime.value = Array.isArray(value) ? value[0]! : value
  },
})

const volumeSlider = computed<SliderValue>({
  get: () => displayVolume.value,
  set: (value) => {
    displayVolume.value = Array.isArray(value) ? value[0]! : value
  },
})

const columns: TableColumn<Music>[] = [
  {
    accessorKey: 'index',
    header: '#',
  },
  {
    accessorKey: 'title',
    header: '名称',
  },
  {
    accessorKey: 'duration',
    header: '时长',
    cell: ({ getValue }) => {
      const value = getValue<number>()
      return formatTime(value)
    },
  },
  {
    id: 'action',
  },
]
function onSelect(_e: Event, row: TableRow<Music>) {
  playAt(row.original.index)
}
function getDropdownActions(music: Music): DropdownMenuItem[][] {
  return [
    [
      {
        label: 'Edit',
        icon: 'i-lucide-edit',
        onSelect: () => {
          edit.value = { open: true, id: music.id }
        },
      },
      {
        label: 'Info',
        icon: 'i-lucide-info',
        onSelect: () => {
          info.value = { open: true, id: music.id }
        },
      },
      {
        label: 'Clear Tags',
        icon: 'i-lucide-eraser',
        onSelect: async () => {
          await selfFetch('/api/music/tags', {
            method: 'DELETE',
            params: { id: music.id },
          })
          toast.add({ title: '已清除标签', color: 'success', duration: 1200 })
          load()
        },
      },
    ],
  ]
}
</script>

<template>
  <div class="flex h-screen flex-col">
    <div class="flex min-h-0 flex-1">
      <div class="h-full w-1/3 overflow-hidden">
        <UTable
          :data="musics"
          :columns="columns"
          class="h-full scrollbar-none"
          @select="onSelect"
        >
          <template #action-cell="{ row }">
            <UDropdownMenu :items="getDropdownActions(row.original)">
              <UButton
                icon="i-lucide-ellipsis-vertical"
                color="neutral"
                variant="ghost"
                aria-label="Actions"
              />
            </UDropdownMenu>
          </template>
        </UTable>
        <!-- 音乐编辑 -->
        <MusicEdit :id="edit.id" v-model:open="edit.open" @saved="load" />
        <!-- 音乐信息 -->
        <MusicInfo :id="info.id" v-model:open="info.open" />
      </div>
      <div class="flex-1 overflow-hidden p-10">
        <LyricsPanel :text="lyrics" :current-time="currentTime" />
      </div>
    </div>
    <div class="flex h-1/6 gap-6 px-6">
      <div class="flex w-1/5 items-center gap-4">
        <div class="size-16 shrink-0 flex items-center justify-center">
          <img
            v-if="cover && !coverError"
            :src="cover"
            class="rounded-md size-full object-cover"
            alt="cover"
            @error="coverError = true"
          >
          <Icon
            v-else
            name="i-lucide-music"
            size="2.5em"
            class="text-neutral"
          />
        </div>
        <div class="flex flex-col truncate">
          <span class="text-lg font-medium truncate"> {{ current.title }}</span>
          <span class="text-base text-gray-500 truncate">{{ current.artist }}</span>
        </div>
      </div>
      <div class="flex w-3/5 flex-col items-center justify-center gap-3">
        <div class="flex items-center justify-center gap-8">
          <UButton
            icon="i-lucide-shuffle"
            variant="link"
            size="lg"
            :color="shuffle ? 'primary' : 'neutral'"
            :ui="{
              base: 'p-0',
            }"
            @click="shuffle = !shuffle"
          />
          <UButton
            icon="i-lucide-skip-back"
            variant="link"
            size="xl"
            color="neutral"
            :ui="{
              base: 'p-0',
            }"
            @click="prev()"
          />
          <UButton
            :icon="wantPlay ? 'i-lucide-pause' : 'i-lucide-play'"
            variant="link"
            size="xl"
            :ui="{
              base: 'p-0',
              leadingIcon: 'size-12',
            }"
            @click="togglePlay()"
          />
          <UButton
            icon="i-lucide-skip-forward"
            variant="link"
            size="xl"
            color="neutral"
            :ui="{
              base: 'p-0',
            }"
            @click="next()"
          />
          <UButton
            icon="i-lucide-repeat"
            variant="link"
            size="lg"
            :color="repeat ? 'primary' : 'neutral'"
            :ui="{
              base: 'p-0',
            }"
            @click="repeat = !repeat"
          />
        </div>
        <div class="flex items-center gap-2 w-full max-w-2xl">
          <span class="text-sm tabular-nums">{{ formatTime(currentTime) }}</span>
          <USlider
            v-model="currentTimeSlider"
            :min="0"
            :max="duration"
            :ui="{
              root: 'cursor-pointer',
            }"
          />
          <span class="text-sm tabular-nums">{{ formatTime(duration) }}</span>
        </div>
      </div>
      <div class="flex w-1/5 items-center gap-2">
        <UButton
          :icon="muted ? 'i-lucide-volume-x' : 'i-lucide-volume-2'"
          variant="link"
          color="neutral"
          @click="muted = !muted"
        />
        <USlider
          v-model="volumeSlider"
          :min="0"
          :max="1"
          :step="0.01"
          :ui="{
            root: 'cursor-pointer',
          }"
        />
      </div>
    </div>
  </div>
</template>
