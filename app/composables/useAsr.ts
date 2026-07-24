import decode from '@audio/decode'
import encode from '@audio/encode'
import { useBase64, useUserMedia } from '@vueuse/core'

export function useSpeechRecognition() {
  const { stream, start: startStream, stop: stopStream } = useUserMedia({
    constraints: { audio: true },
  })

  const result = ref('')
  const finished = ref(false)
  const blob = ref<Blob>()
  const { base64 } = useBase64(blob, { dataUrl: true })

  let recorder: MediaRecorder
  let chunks: Blob[] = []
  let listening = false

  watch(stream, (s) => {
    if (!s)
      return
    recorder = new MediaRecorder(s)
    recorder.ondataavailable = ({ data }) => data.size && chunks.push(data)
    recorder.onstop = async () => {
      try {
        const webmBlob = new Blob(chunks, { type: 'audio/webm' })
        chunks = []
        if (webmBlob.size === 0) {
          result.value = ''
          finished.value = true
          return
        }

        // WebM → MP3
        const arrayBuffer = await webmBlob.arrayBuffer()
        const audioBuffer = await decode(arrayBuffer)
        const channelData = audioBuffer.channelData[0]
        if (!channelData) {
          result.value = ''
          finished.value = true
          return
        }
        const mp3U8 = await encode.mp3(channelData, {
          sampleRate: audioBuffer.sampleRate,
          bitrate: 128,
        })
        const mp3Buffer = new ArrayBuffer(mp3U8.byteLength)
        new Uint8Array(mp3Buffer).set(mp3U8)
        blob.value = new Blob([mp3Buffer], { type: 'audio/mpeg' })
      }
      finally {
        listening = false
      }
    }
    recorder.start()
    listening = true
  })

  const start = async () => {
    if (listening)
      return
    await startStream()
  }

  const stop = () => {
    const hasRecorder = recorder && recorder.state !== 'inactive'

    if (hasRecorder) {
      recorder.stop()
    }
    else {
      result.value = ''
      finished.value = true
      listening = false
    }

    stopStream()
  }

  watch(base64, async (b) => {
    if (b) {
      result.value = await selfFetch('/api/asr', {
        method: 'post',
        body: { base64: b },
      })
      finished.value = true
    }
  })

  return { finished, start, stop, result }
}
