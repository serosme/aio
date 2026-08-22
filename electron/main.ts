import { app, globalShortcut } from 'electron'
import { createAsrWindow } from './asr/window.ts'
import { createCommandWindow } from './command/window.ts'
import { registerIpcHandlers } from './ipc/index.ts'
import { startNuxtServer } from './renderer.ts'
import { createTray, destroyTray } from './tray.ts'
import { toggleDevTools, toggleWindow } from './windows.ts'

app.commandLine.appendSwitch('enable-features', 'OverlayScrollbar,FluentOverlayScrollbar')

app.applicationMenu = null

app.whenReady().then(async () => {
  await startNuxtServer()
  createTray()
  const win = await createCommandWindow()
  await createAsrWindow()

  registerIpcHandlers()

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
  destroyTray()
})
