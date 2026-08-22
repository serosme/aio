import { useUserMedia, useWebSocket } from '@vueuse/core'

export function useVoiceInput() {
  const recording = ref(false)
  const result = ref('')

  const { send } = useWebSocket('/api/ws/asr', {
    autoReconnect: true,
    onMessage(_ws, event) {
      const data = JSON.parse(event.data as string) as ServerMessage
      handleMessage(data)
    },
  })

  const {
    start: startUserMedia,
    stop: stopUserMedia,
  } = useUserMedia({ constraints: { audio: true } })

  let mediaRecorder: MediaRecorder | null = null
  let blobChunks: Blob[] = []

  async function start() {
    if (mediaRecorder)
      return
    result.value = ''
    const stream = await startUserMedia()
    if (!stream)
      return
    const mimeType = ['audio/webm;codecs=opus', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type)) ?? undefined
    mediaRecorder = new MediaRecorder(stream, { mimeType })
    blobChunks = []
    mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0)
        blobChunks.push(event.data)
    })
    mediaRecorder.start()
    recording.value = true
  }

  async function stop() {
    const recorder = mediaRecorder
    if (!recorder)
      return
    const stopped = new Promise<void>((resolve) => {
      recorder.addEventListener('stop', () => resolve(), { once: true })
    })
    recorder.stop()
    await stopped
    stopUserMedia()
    const blob = new Blob(blobChunks, { type: recorder.mimeType })
    const base64 = await blobToBase64(blob)
    mediaRecorder = null
    blobChunks = []
    recording.value = false

    try {
      const { text } = await selfFetch<{ text: string }>('/api/asr', {
        method: 'POST',
        body: { data: base64 },
      })
      result.value = text
      send(JSON.stringify({ type: 'result', text } satisfies ClientMessage))
    }
    catch {
      void 0
    }
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.addEventListener('load', () => resolve(String(reader.result).split(',')[1]!))
      reader.addEventListener('error', () => reject(reader.error))
      reader.readAsDataURL(blob)
    })
  }

  function handleMessage(msg: ServerMessage) {
    switch (msg.type) {
      case 'voice-start':
        start()
        break
      case 'voice-stop':
        stop()
        break
      case 'voice-result':
        result.value = msg.text
        break
      default: {
        const _exhaustive: never = msg
        void _exhaustive
      }
    }
  }

  return { recording, result, start, stop }
}
