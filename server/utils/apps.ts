import { execSync } from 'node:child_process'

function getAllApps(): ApplicationItem[] {
  const stdout = execSync(
    'powershell -NoProfile -command "[Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8; Get-StartApps | ConvertTo-Json"',
    { maxBuffer: 1 * 1024 * 1024 },
  ).toString()

  if (!stdout.trim()) {
    return []
  }

  const apps = JSON.parse(stdout) as Array<{ Name: string, AppID: string }>

  return [...new Map(apps.map(a => [a.Name, a])).values()]
    .map(a => ({ name: a.Name, id: a.AppID }))
}

export function getAppNames(): { name: string }[] {
  return getAllApps().map(a => ({ name: a.name }))
}

export function getAppId(name: string): string | undefined {
  return getAllApps().find(a => a.name === name)?.id
}
