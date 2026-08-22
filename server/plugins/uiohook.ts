import { uIOhook, UiohookKey } from 'uiohook-napi'

const longPressed = new Set<number>()
const timers = new Map<number, NodeJS.Timeout>()

export default defineNitroPlugin(() => {
  uIOhook.on('keydown', (e) => {
    if (e.keycode !== UiohookKey.CapsLock)
      return

    if (timers.has(e.keycode))
      return
    timers.set(e.keycode, setTimeout(() => {
      longPressed.add(e.keycode)
      logger.info('[asr] 快捷键按下')
      broadcastWs({ type: 'voice-start' } satisfies ServerMessage)
      logger.info('[asr] 录音开始')
    }, 150))
  })

  uIOhook.on('keyup', async (e) => {
    if (e.keycode !== UiohookKey.CapsLock)
      return

    clearTimeout(timers.get(e.keycode))
    timers.delete(e.keycode)

    if (!longPressed.has(e.keycode))
      return

    longPressed.delete(e.keycode)
    logger.info('[asr] 快捷键抬起')

    await new Promise(resolve => setTimeout(resolve, 50))
    uIOhook.keyTap(UiohookKey.CapsLock, [])

    broadcastWs({ type: 'voice-stop' } satisfies ServerMessage)
    logger.info('[asr] 录音结束')
  })

  uIOhook.start()
})
