import { fileURLToPath } from 'node:url'
import { getAppBaseUrl } from '../ports.ts'
import { createWindow } from '../windows.ts'

const preloadPath = fileURLToPath(new URL('../preload.cjs', import.meta.url))

export function createCommandWindow() {
  return createWindow('Command Palette', `${getAppBaseUrl()}/command`, {
    width: 1280,
    height: 720,
    show: false,
    titleBarStyle: 'hidden',
    skipTaskbar: true,
    webPreferences: {
      preload: preloadPath,
    },
  })
}
