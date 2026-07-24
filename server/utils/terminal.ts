import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

let cachedInfo: { settingsPath: string | null, terminalPath: string | null } | null = null

function getTerminalInfo(): { settingsPath: string | null, terminalPath: string | null } {
  if (cachedInfo) {
    return cachedInfo
  }

  try {
    const stdout = execSync(
      'powershell -NoProfile -command "$pkg = Get-AppxPackage -Name Microsoft.WindowsTerminal -ErrorAction SilentlyContinue; if ($pkg) { $localAppData = [Environment]::GetFolderPath(\'LocalApplicationData\'); $settingsPath = Join-Path $localAppData \'Packages\' | Join-Path -ChildPath $pkg.PackageFamilyName | Join-Path -ChildPath \'LocalState\' | Join-Path -ChildPath \'settings.json\'; $terminalPath = Join-Path $pkg.InstallLocation \'wt.exe\'; Write-Output ($settingsPath + \'|\' + $terminalPath) }"',
      { maxBuffer: 1024 * 1024 },
    ).toString().trim()

    if (!stdout) {
      cachedInfo = { settingsPath: null, terminalPath: null }
      return cachedInfo
    }

    const [settingsPath, terminalPath] = stdout.split('|')
    cachedInfo = { settingsPath: settingsPath || null, terminalPath: terminalPath || null }
    return cachedInfo
  }
  catch (err) {
    console.error('获取 Windows Terminal 信息失败:', err)
    cachedInfo = { settingsPath: null, terminalPath: null }
    return cachedInfo
  }
}

function getSettingsPath(): string | null {
  return getTerminalInfo().settingsPath
}

export function getTerminalProfiles(): string[] {
  const settingsPath = getSettingsPath()
  if (!settingsPath) {
    return []
  }

  try {
    const raw = readFileSync(settingsPath, 'utf-8')
    const json = JSON.parse(raw)
    const list: Array<{ name: string, hidden?: boolean }> = json?.profiles?.list ?? []
    return list
      .filter(p => !p.hidden)
      .map(p => p.name)
      .filter(Boolean)
  }
  catch (err) {
    console.error('读取终端配置文件失败:', err)
    return []
  }
}

export function getTerminalPath(): string | null {
  return getTerminalInfo().terminalPath
}
