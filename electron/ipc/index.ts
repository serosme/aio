import { ipcMain } from 'electron'
import { getAppBaseUrl } from '../ports.ts'
import { createWindow } from '../windows.ts'

export function registerIpcHandlers() {
  ipcMain.handle('window:open', async (_event, payload: { name: string, url: string }) => {
    const url = new URL(payload.url)
    if (url.origin !== getAppBaseUrl())
      throw new Error('只允许打开应用内页面')

    await createWindow(payload.name, url.href, {
      width: 1440,
      height: 900,
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#FFFFFF',
        symbolColor: '#000000',
      },
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    })
  })
}
