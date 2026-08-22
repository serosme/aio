import type { BrowserWindowConstructorOptions } from 'electron'
import process from 'node:process'
import { BrowserWindow } from 'electron'
import { updateTrayMenu } from './tray.ts'

const windows = new Map<string, BrowserWindow>()

export async function createWindow(name: string, url: string, options: BrowserWindowConstructorOptions, devtools = true): Promise<BrowserWindow> {
  const existing = windows.get(name)
  if (existing) {
    existing.focus()
    return existing
  }

  const win = new BrowserWindow(options)
  await win.loadURL(url)

  if (devtools && process.env.NODE_ENV === 'dev') {
    win.webContents.openDevTools()
  }

  windows.set(name, win)

  win.on('closed', () => {
    windows.delete(name)
    updateTrayMenu()
  })

  updateTrayMenu()
  return win
}

export function getWindows(): Array<{ name: string, win: BrowserWindow }> {
  return Array.from(windows.entries()).map(([name, win]) => ({ name, win }))
}

export function toggleWindow(win: BrowserWindow) {
  if (win.isVisible() && !win.isMinimized()) {
    win.hide()
  }
  else {
    win.show()
    win.focus()
  }
}

export function toggleDevTools() {
  const win = BrowserWindow.getFocusedWindow()
  if (win) {
    win.webContents.toggleDevTools()
  }
}
