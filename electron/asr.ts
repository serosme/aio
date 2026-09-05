import { Buffer } from 'node:buffer'
import { once } from 'node:events'
import { Microphone } from 'decibri'
import { clipboard } from 'electron'
import { uIOhook, UiohookKey } from 'uiohook-napi'
import { getAppBaseUrl } from './ports.ts'
import { logger } from './utils/logger.ts'

const sampleRate = 16000
const channels = 1
const bitsPerSample = 16
const maxRecordingDuration = 60_000
const microphoneStopTimeout = 3_000

let microphone: Microphone | undefined
let recordingTimer: NodeJS.Timeout | undefined
let opening: Promise<void> | undefined
let stopRequested = false
let busy = false
let chunks: Buffer[] = []
let longPressTimer: NodeJS.Timeout | undefined
let longPressed = false

export function startAsr(): void {
  uIOhook.on('keydown', handleKeydown)
  uIOhook.on('keyup', handleKeyup)
  logger.info('[uiohook] 启动全局监听')
  uIOhook.start()
  logger.info('[uiohook] 全局监听已启动')
}

export function stopAsr(): void {
  clearTimeout(longPressTimer)
  longPressTimer = undefined
  clearTimeout(recordingTimer)
  recordingTimer = undefined
  longPressed = false
  stopRequested = true
  microphone?.stop()
  microphone = undefined
  uIOhook.stop()
  logger.info('[uiohook] 全局监听已停止')
}

function handleKeydown(e: { keycode: number }): void {
  if (e.keycode !== UiohookKey.CapsLock)
    return

  if (longPressTimer || opening || microphone || busy)
    return

  longPressTimer = setTimeout(() => {
    longPressTimer = undefined
    longPressed = true
    logger.info('[uiohook] 长按触发')
    void startRecording().catch(error => logger.error(`[asr] 录音启动失败: ${String(error)}`))
  }, 150)
}

async function handleKeyup(e: { keycode: number }): Promise<void> {
  if (e.keycode !== UiohookKey.CapsLock)
    return

  clearTimeout(longPressTimer)
  longPressTimer = undefined
  if (!longPressed)
    return

  longPressed = false
  await new Promise(resolve => setTimeout(resolve, 50))
  uIOhook.keyTap(UiohookKey.CapsLock, [])
  void stopRecording().catch(error => logger.error(`[asr] 录音停止失败: ${String(error)}`))
}

async function startRecording(): Promise<void> {
  logger.info('[recorder] 收到开始录音请求')
  if (microphone || opening || busy) {
    logger.info('[recorder] 当前不可开始录音')
    return
  }

  stopRequested = false
  chunks = []
  opening = (async () => {
    logger.info('[recorder] 正在打开麦克风')
    const next = await Microphone.open({
      sampleRate,
      channels,
      framesPerBuffer: 1600,
      dtype: 'int16',
    })

    if (stopRequested) {
      next.stop()
      return
    }

    microphone = next
    next.on('data', (chunk: Buffer) => chunks.push(chunk))
    next.on('error', error => logger.error(`[asr] 麦克风异常: ${String(error)}`))
    recordingTimer = setTimeout(() => {
      recordingTimer = undefined
      void stopRecording().catch(error => logger.error(`[asr] 录音超时停止失败: ${String(error)}`))
    }, maxRecordingDuration)
    logger.info('[recorder] 麦克风已打开，开始录音')
  })()

  try {
    await opening
  }
  finally {
    opening = undefined
  }

  if (stopRequested && microphone)
    await stopRecording()
}

async function stopRecording(): Promise<void> {
  logger.info('[recorder] 收到停止录音请求')
  stopRequested = true
  if (opening)
    await opening

  const current = microphone
  if (!current) {
    logger.info('[recorder] 当前没有正在录音')
    stopRequested = false
    return
  }

  clearTimeout(recordingTimer)
  recordingTimer = undefined
  busy = true
  microphone = undefined
  const ended = Promise.race([
    once(current, 'end'),
    new Promise<'timeout'>(resolve => setTimeout(resolve, microphoneStopTimeout, 'timeout')),
  ])
  current.stop()
  const result = await ended
  if (result === 'timeout')
    logger.error('[recorder] 等待麦克风结束超时')
  stopRequested = false
  logger.info(`[recorder] 录音流已结束，收到 ${chunks.length} 个音频块`)

  try {
    const audio = pcmToWav(Buffer.concat(chunks))
    chunks = []
    logger.info(`[recorder] 开始识别，语音大小 ${audio.length} 字节`)
    const text = await recognize(audio)

    logger.info(`[asr] 识别完成，文本长度 ${text.length}`)
    clipboard.writeText(text)
    logger.info('[asr] 写入剪贴板')
    uIOhook.keyTap(UiohookKey.V, [UiohookKey.Ctrl])
    logger.info('[asr] 执行粘贴')
  }
  finally {
    busy = false
  }
}

async function recognize(audio: Buffer): Promise<string> {
  const response = await fetch(`${getAppBaseUrl()}/api/asr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio: audio.toString('base64') }),
  })

  if (!response.ok)
    throw new Error(await response.text())

  const result = await response.json() as { text: string }
  return result.text
}

function pcmToWav(pcm: Buffer): Buffer {
  const blockAlign = channels * bitsPerSample / 8
  const byteRate = sampleRate * blockAlign
  const wav = Buffer.alloc(44 + pcm.length)

  wav.write('RIFF', 0)
  wav.writeUInt32LE(36 + pcm.length, 4)
  wav.write('WAVE', 8)
  wav.write('fmt ', 12)
  wav.writeUInt32LE(16, 16)
  wav.writeUInt16LE(1, 20)
  wav.writeUInt16LE(channels, 22)
  wav.writeUInt32LE(sampleRate, 24)
  wav.writeUInt32LE(byteRate, 28)
  wav.writeUInt16LE(blockAlign, 32)
  wav.writeUInt16LE(bitsPerSample, 34)
  wav.write('data', 36)
  wav.writeUInt32LE(pcm.length, 40)
  pcm.copy(wav, 44)

  return wav
}
