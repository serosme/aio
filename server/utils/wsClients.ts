import type { Peer } from 'crossws'

const clients = new Set<Peer>()

export function registerWsClient(peer: Peer): void {
  clients.add(peer)
  logger.info(`[ws] 客户端上线: ${peer}（当前 ${clients.size} 个连接）`)
}

export function unregisterWsClient(peer: Peer): void {
  clients.delete(peer)
  logger.info(`[ws] 客户端下线: ${peer}（当前 ${clients.size} 个连接）`)
}

export function broadcastWs(message: ServerMessage): void {
  const payload = JSON.stringify(message)
  for (const peer of clients) {
    try {
      peer.send(payload)
    }
    catch (error) {
      logger.error(`[ws] 推送失败: ${String(error)}`)
    }
  }
}
