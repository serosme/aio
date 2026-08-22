import { ipcMain } from 'electron'
import { createWindow } from '../windows.ts'

export function registerIpcHandlers() {
  ipcMain.handle('window:open', async (_event, payload: { name: string, url: string }) => {
    await createWindow(payload.name, payload.url, {
      width: 1440,
      height: 900,
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#FFFFFF',
        symbolColor: '#000000',
      },
    })
  })
}
