import { execSync } from 'node:child_process'

let cachedApps: ApplicationItem[] = []

function getAllApps(): ApplicationItem[] {
  const stdout = execSync(
    'powershell -NoProfile -command "[Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8; Get-StartApps | ConvertTo-Json"',
    { maxBuffer: 1 * 1024 * 1024 },
  ).toString()

  if (!stdout.trim()) {
    cachedApps = []
    return cachedApps
  }

  const apps = JSON.parse(stdout) as Array<{ Name: string, AppID: string }>

  cachedApps = [...new Map(apps.map(a => [a.Name, a])).values()]
    .map(a => ({ name: a.Name, id: a.AppID }))
  return cachedApps
}

export function getAppNames(): { name: string }[] {
  return getAllApps().map(a => ({ name: a.name }))
}

export function getAppId(name: string): string {
  const app = cachedApps.find(a => a.name === name)
  if (!app)
    throw createError({ statusCode: 400, message: '应用不存在' })
  return app.id
}
