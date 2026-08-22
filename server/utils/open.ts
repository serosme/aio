import { spawn } from 'node:child_process'

export function openProcess(command: string, args: string[]): void {
  const child = spawn(command, args, { detached: true, stdio: 'ignore' })
  child.unref()
}
