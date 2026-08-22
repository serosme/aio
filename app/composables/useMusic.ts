import { useMediaControls } from '@vueuse/core'

export function useMusic() {
  const audio = ref<HTMLAudioElement>()
  const musics = ref<Music[]>([])
  const index = ref<number>(0)
  const shuffle = ref(false)
  const repeat = ref(false)
  // 播放意图：仅随用户操作/播放结束变化，避免切歌缓冲时 playing 短暂 false 导致图标闪烁
  const wantPlay = ref(false)
  const current = computed(() => {
    return musics.value[index.value] || {
      id: '',
      index: 0,
      title: '未知歌曲',
      artist: '未知艺术家',
      duration: 0,
    }
  })
  const src = computed(() => {
    if (!current.value.id)
      return ''
    const params = new URLSearchParams({ id: current.value.id })
    return `/api/music/stream?${params.toString()}`
  })
  const cover = computed(() => {
    if (!current.value.id)
      return ''
    const params = new URLSearchParams({ id: current.value.id })
    return `/api/music/cover?${params.toString()}`
  })
  const { playing, currentTime, duration, volume, muted, ended } = useMediaControls(
    audio,
    { src },
  )

  const lyrics = ref('')
  watch(() => current.value.id, async (id) => {
    if (!id) {
      lyrics.value = ''
      return
    }
    const { text } = await selfFetch<{ text: string }>('/api/music/lyrics', { params: { id } })
    lyrics.value = text
  })
  // 显示音量：静音时显示 0，拖动滑块时写入真实音量并取消静音
  const displayVolume = computed({
    get: () => muted.value ? 0 : volume.value,
    set: (v: number) => {
      volume.value = v
      if (muted.value)
        muted.value = false
    },
  })

  const load = async () => {
    const data = await selfFetch<Music[]>('/api/music')
    musics.value = data
  }

  const togglePlay = () => {
    wantPlay.value = !wantPlay.value
    playing.value = wantPlay.value
  }

  const playAt = (i: number) => {
    index.value = i
    wantPlay.value = true
    setTimeout(() => {
      playing.value = true
    }, 50)
  }

  const playRandom = () => {
    if (musics.value.length === 0)
      return
    let i
    do {
      i = Math.floor(Math.random() * musics.value.length)
    } while (i === index.value && musics.value.length > 1)
    playAt(i)
  }

  const next = () => {
    if (shuffle.value) {
      playRandom()
      return
    }
    const nextIndex = (index.value + 1) % musics.value.length
    playAt(nextIndex)
  }

  const prev = () => {
    const prevIndex = index.value === 0
      ? musics.value.length - 1
      : index.value - 1
    playAt(prevIndex)
  }

  // 播放结束自动下一首：随机模式随机切换，顺序模式到末尾时仅循环模式继续
  watch(ended, (isEnded) => {
    if (!isEnded || musics.value.length === 0)
      return
    if (shuffle.value) {
      playRandom()
      return
    }
    const nextIndex = index.value + 1
    if (nextIndex < musics.value.length) {
      playAt(nextIndex)
    }
    else if (repeat.value) {
      playAt(0)
    }
    else {
      wantPlay.value = false
    }
  })

  onMounted(async () => {
    audio.value = new Audio()
    volume.value = 0.5
    await load()
  })

  return {
    musics,
    current,
    cover,
    lyrics,
    load,
    playAt,
    next,
    prev,
    togglePlay,
    playing,
    currentTime,
    duration,
    volume,
    displayVolume,
    muted,
    shuffle,
    repeat,
    wantPlay,
  }
}
