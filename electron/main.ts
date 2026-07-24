import { app, globalShortcut } from 'electron'
import { uIOhook } from 'uiohook-napi'
import { initAsr } from './asr/index.ts'
import { createCommandWindow } from './command/window.ts'
import { startNuxtServer } from './renderer.ts'
import { createTray, destroyTray } from './tray.ts'
import { toggleDevTools, toggleWindow } from './windows.ts'

app.commandLine.appendSwitch('disable-renderer-backgrounding')

app.applicationMenu = null

app.whenReady().then(async () => {
  uIOhook.start()
  await startNuxtServer()
  createTray()
  const win = await createCommandWindow()
  await initAsr()

  globalShortcut.register('Alt+Space', () => toggleWindow(win))
  globalShortcut.register('Ctrl+Shift+D', () => toggleDevTools())

  win.on('blur', () => {
    win.hide()
  })
})

app.on('window-all-closed', () => {
  // no-op
})

app.on('before-quit', () => {
  uIOhook.stop()
  destroyTray()
})
