export function getAppPort(): number {
  return 2999
}

export function getAppBaseUrl(): string {
  return `http://localhost:${getAppPort()}`
}
