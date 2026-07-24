import { createWindow } from '../windows.ts'

export function createCommandWindow() {
  return createWindow('命令面板', 'http://localhost:2999/command', {
    width: 1280,
    height: 720,
    show: false,
    titleBarStyle: 'hidden',
    skipTaskbar: true,
  })
}
