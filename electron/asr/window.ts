import { getAppBaseUrl } from '../ports.ts'
import { createWindow } from '../windows.ts'

export function createAsrWindow() {
  return createWindow('ASR', `${getAppBaseUrl()}/asr`, {
    width: 1280,
    height: 720,
    show: false,
    skipTaskbar: true,
  }, false)
}
