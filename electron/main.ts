import type { BrowserWindow } from 'electron'
import { app, globalShortcut } from 'electron'
import { startAsr, stopAsr } from './asr.ts'
import { createCommandWindow } from './command/window.ts'
import { registerIpcHandlers } from './ipc/index.ts'
import { startNuxtServer } from './renderer.ts'
import { createTray, destroyTray } from './tray.ts'
import { toggleDevTools, toggleWindow } from './windows.ts'

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock)
  app.quit()

let commandWindow: BrowserWindow | undefined

app.commandLine.appendSwitch('enable-features', 'OverlayScrollbar,FluentOverlayScrollbar')

app.applicationMenu = null

app.on('second-instance', () => {
  if (commandWindow)
    toggleWindow(commandWindow)
})

app.whenReady().then(async () => {
  await startNuxtServer()
  startAsr()
  createTray()
  commandWindow = await createCommandWindow()

  registerIpcHandlers()

  globalShortcut.register('Alt+Space', () => toggleWindow(commandWindow!))
  globalShortcut.register('Ctrl+Shift+D', () => toggleDevTools())

  commandWindow.on('blur', () => {
    commandWindow?.hide()
  })
})

app.on('window-all-closed', () => {
  // no-op
})

app.on('before-quit', () => {
  stopAsr()
  destroyTray()
})
