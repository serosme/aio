import { spawn } from 'node:child_process'

export function openProcess(command: string, args: string[]): void {
  const child = spawn(command, args, { detached: true, stdio: 'ignore' })
  child.on('error', error => logger.error(`[open] 启动 ${command} 失败: ${String(error)}`))
  child.unref()
}
