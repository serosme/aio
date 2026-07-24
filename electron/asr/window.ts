import path from 'node:path'
import { app } from 'electron'
import { createWindow } from '../windows.ts'

export function createAsrWindow() {
  return createWindow('语音识别', 'http://localhost:2999/asr', {
    width: 1280,
    height: 720,
    show: false,
    webPreferences: {
      preload: path.join(app.getAppPath(), './electron/preload.cjs'),
    },
  })
}
