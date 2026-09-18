import type { BrowserWindowConstructorOptions } from 'electron'
import { BrowserWindow } from 'electron'
import { updateTrayMenu } from './tray.ts'
import { logger } from './utils/logger.ts'

const windows = new Map<string, BrowserWindow>()

export async function createWindow(name: string, url: string, options: BrowserWindowConstructorOptions): Promise<BrowserWindow> {
  const existing = windows.get(name)
  if (existing) {
    existing.focus()
    return existing
  }

  const win = new BrowserWindow(options)

  win.webContents.on('did-start-loading', () => {
    logger.info(`[window] 开始加载页面: ${name}, ${url}`)
  })
  win.webContents.on('did-finish-load', () => {
    logger.info(`[window] 页面加载完成: ${name}`)
  })
  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    logger.error(`[window] 页面加载失败: ${name}, ${errorCode} ${errorDescription}`)
  })
  win.on('closed', () => {
    logger.info(`[window] 窗口已关闭: ${name}`)
    windows.delete(name)
    updateTrayMenu()
  })

  windows.set(name, win)
  updateTrayMenu()
  await win.loadURL(url)
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
