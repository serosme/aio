import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'

function toEncodedCommand(script: string): string {
  return Buffer.from(script, 'utf16le').toString('base64')
}

export default defineEventHandler((event) => {
  const { name } = getQuery(event) as { name: string }

  const script = getCommandScript(name)
  if (!script) {
    throw createError({ message: `Unknown command: ${name}` })
  }

  const child = spawn('wt.exe', ['powershell', '-NoExit', '-EncodedCommand', toEncodedCommand(script)], {
    detached: true,
    stdio: 'ignore',
  })
  child.on('error', () => {
    spawn('powershell.exe', ['-NoExit', '-Command', script], {
      detached: true,
      stdio: 'ignore',
    }).unref()
  })
  child.unref()
})
