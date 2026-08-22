import process from 'node:process'

export function getAppPort(): number {
  return Number(process.env.DEV_PORT ?? 2999)
}

export function getAppBaseUrl(): string {
  return `http://localhost:${getAppPort()}`
}
