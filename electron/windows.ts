import type { BrowserWindowConstructorOptions } from 'electron'
import process from 'node:process'
import { BrowserWindow } from 'electron'
import { updateTrayMenu } from './tray.ts'

const windows = new Map<string, BrowserWindow>()

export async function createWindow(name: string, url: string, options: BrowserWindowConstructorOptions): Promise<BrowserWindow> {
  if (windows.has(name)) {
    const existingWin = windows.get(name)
    if (existingWin && !existingWin.isDestroyed()) {
      existingWin.focus()
      return existingWin
    }
    windows.delete(name)
  }

  const win = new BrowserWindow(options)

  try {
    await win.loadURL(url)
  }
  catch (err) {
    console.error(`Failed to load URL ${url}:`, err)
    win.destroy()
    throw err
  }

  if (process.env.NODE_ENV === 'dev') {
    // win.webContents.openDevTools()
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

export function getWindow(name: string): BrowserWindow | undefined {
  return windows.get(name)
}

export function toggleWindow(win: BrowserWindow) {
  if (win.isDestroyed()) {
    return
  }

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
