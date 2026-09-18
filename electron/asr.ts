import { Buffer } from 'node:buffer'
import { finished } from 'node:stream/promises'
import { Microphone } from 'decibri'
import { clipboard } from 'electron'
import { uIOhook, UiohookKey } from 'uiohook-napi'
import { getAppBaseUrl } from './ports.ts'
import { logger } from './utils/logger.ts'

let microphone: Microphone | undefined
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

  // 长按成立后直到松手为止不再响应，挡掉按住时的自动重复和自己注入的合成事件
  if (longPressTimer || longPressed)
    return

  longPressTimer = setTimeout(() => {
    longPressTimer = undefined
    longPressed = true
    logger.info('[uiohook] 长按触发')

    if (opening || microphone || busy) {
      logger.info('[recorder] 当前不可开始录音')
      return
    }

    void startRecording().catch(error => logger.error(`[asr] 录音启动失败: ${String(error)}`))
  }, 150)
}

function handleKeyup(e: { keycode: number }): void {
  if (e.keycode !== UiohookKey.CapsLock)
    return

  clearTimeout(longPressTimer)
  longPressTimer = undefined
  // 补击注入的合成 keyup 也会走到这里，那时 longPressed 已被清掉
  if (!longPressed)
    return

  longPressed = false
  // uiohook 只监听不拦截，长按期间系统已经切换过一次大小写，等按键弹起后补一次抵消
  setTimeout(() => uIOhook.keyTap(UiohookKey.CapsLock, []), 50)
  void stopRecording().catch(error => logger.error(`[asr] 录音停止失败: ${String(error)}`))
}

async function startRecording(): Promise<void> {
  logger.info('[recorder] 收到开始录音请求')
  stopRequested = false
  chunks = []
  opening = (async () => {
    logger.info('[recorder] 正在打开麦克风')
    const next = await Microphone.open({
      // 16000Hz / 单声道 int16 裸 PCM，与 server/api/asr.post.ts 的请求参数对应
      sampleRate: 16000,
      channels: 1,
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
    logger.info('[recorder] 麦克风已打开，开始录音')
  })()

  try {
    await opening
  }
  finally {
    opening = undefined
  }
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

  busy = true
  microphone = undefined
  // 设备异常时流会被销毁、不再触发 end，finished 会立即返回而不会卡住
  const ended = finished(current).catch(() => logger.error('[recorder] 音频流提前结束'))
  current.stop()
  await ended
  stopRequested = false
  logger.info(`[recorder] 录音流已结束，收到 ${chunks.length} 个音频块`)

  try {
    const audio = Buffer.concat(chunks)
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
    headers: { 'Content-Type': 'application/octet-stream' },
    body: audio,
  })

  if (!response.ok)
    throw new Error(await response.text())

  const result = await response.json() as { text: string }
  return result.text
}
