import process from 'node:process'
import { defineWebSocketHandler } from 'h3'

export default defineWebSocketHandler({
  open(peer) {
    registerWsClient(peer)
  },
  message(peer, message) {
    const data = message.json() as ClientMessage
    if (data.type !== 'result')
      return
    logger.info(`[asr] 识别结果: ${data.text}`)
    setClipboard(data.text)
    if (!process.env.DEV_PORT)
      pasteFromClipboard()
    broadcastWs({ type: 'voice-result', text: data.text } satisfies ServerMessage)
  },
  close(peer) {
    unregisterWsClient(peer)
  },
  error(peer, error) {
    logger.error(`[asr/ws] 连接异常: ${String(error)}`)
  },
})
