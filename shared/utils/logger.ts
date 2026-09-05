/* eslint-disable no-console */
import { appendFileSync, mkdirSync } from 'node:fs'
import os from 'node:os'
import { join } from 'node:path'

const logDir = join(os.homedir(), '.config', 'aio', 'logs')
const infoLogFile = join(logDir, 'info.log')
const errorLogFile = join(logDir, 'error.log')

mkdirSync(logDir, { recursive: true })

function format(args: unknown[]): string {
  return args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
}

function formatTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function write(level: 'INFO' | 'ERROR', args: unknown[]): void {
  const line = `[${formatTime(new Date())}] [${level}] ${format(args)}`
  appendFileSync(infoLogFile, `${line}\n`, 'utf-8')
  if (level === 'ERROR') {
    appendFileSync(errorLogFile, `${line}\n`, 'utf-8')
  }
  if (level === 'ERROR')
    console.error(line)
  else
    console.log(line)
}

export const logger = {
  info: (...args: unknown[]) => write('INFO', args),
  error: (...args: unknown[]) => write('ERROR', args),
}
