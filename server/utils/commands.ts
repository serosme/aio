import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import os from 'node:os'

export function openCommand(command: string): void {
  const cwd = os.homedir()
  const child = spawn('wt.exe', ['powershell', '-NoExit', '-EncodedCommand', toEncodedCommand(command)], {
    cwd,
    detached: true,
    stdio: 'ignore',
  })
  child.unref()
}

function toEncodedCommand(command: string): string {
  return Buffer.from(command, 'utf16le').toString('base64')
}
