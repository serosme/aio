import process from 'node:process'

export async function startNuxtServer() {
  if (process.env.NODE_ENV !== 'dev') {
    process.env.NITRO_PORT = '2999'
    await import('../.output/server/index.mjs')
  }
}
