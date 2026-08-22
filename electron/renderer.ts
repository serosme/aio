import process from 'node:process'
import { getAppPort } from './ports.ts'

export async function startNuxtServer() {
  if (process.env.NODE_ENV !== 'dev') {
    process.env.NITRO_PORT = String(getAppPort())
    await import('../.output/server/index.mjs')
  }
}
