import { Clipboard } from '@napi-rs/clipboard'
import { uIOhook, UiohookKey } from 'uiohook-napi'

const clipboard = new Clipboard()

export function setClipboard(text: string): void {
  clipboard.setText(text)
  logger.info('[asr] 写入剪贴板')
}

export function pasteFromClipboard(): void {
  uIOhook.keyTap(UiohookKey.V, [UiohookKey.Ctrl])
  logger.info('[asr] 执行粘贴')
}
