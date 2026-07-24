import type { BrowserWindow, IpcMainEvent } from 'electron'
import type { UiohookKeyboardEvent } from 'uiohook-napi'
import { clipboard, ipcMain } from 'electron'
import { uIOhook, UiohookKey } from 'uiohook-napi'
import { createAsrWindow } from './window.ts'

const longPressed = new Set<number>()
type TimerHandle = NodeJS.Timeout
const timers = new Map<number, TimerHandle>()
let asrWin: BrowserWindow | null = null

export async function initAsr(): Promise<BrowserWindow> {
  if (!asrWin)
    asrWin = await createAsrWindow()
  return asrWin
}

async function ensureAsrWin(): Promise<BrowserWindow> {
  if (asrWin)
    return asrWin
  return await initAsr()
}

async function onKeyDown() {
  const win = await ensureAsrWin()
  win.webContents.send('asr-start', '开始')
}

async function onKeyUp(): Promise<boolean> {
  const win = await ensureAsrWin()

  const result = await new Promise<string>((resolve) => {
    const timer = setTimeout(() => {
      resolve('')
    }, 5000)
    ipcMain.once('asr-result', (_event: IpcMainEvent, data: string) => {
      clearTimeout(timer)
      resolve(data)
    })
    win.webContents.send('asr-end')
  })

  if (result) {
    clipboard.writeText(result)
    return true
  }

  return false
}

const isCapsLock = (e: UiohookKeyboardEvent) => e.keycode === UiohookKey.CapsLock

uIOhook.on('keydown', (e) => {
  if (!isCapsLock(e))
    return

  if (timers.has(e.keycode))
    return
  timers.set(e.keycode, setTimeout(() => {
    longPressed.add(e.keycode)
    onKeyDown()
  }, 150))
})

uIOhook.on('keyup', async (e) => {
  if (!isCapsLock(e))
    return

  clearTimeout(timers.get(e.keycode))
  timers.delete(e.keycode)

  if (!longPressed.has(e.keycode))
    return

  longPressed.delete(e.keycode)

  await new Promise(resolve => setTimeout(resolve, 50))
  uIOhook.keyTap(UiohookKey.CapsLock, [])

  const hasResult = await onKeyUp()

  if (hasResult) {
    uIOhook.keyTap(UiohookKey.V, [UiohookKey.Ctrl])
  }
})
