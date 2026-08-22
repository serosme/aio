import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

export function getTerminalProfiles(): string[] {
  try {
    const stdout = execSync(
      'powershell -NoProfile -command "$pkg = Get-AppxPackage -Name Microsoft.WindowsTerminal -ErrorAction SilentlyContinue; if ($pkg) { $localAppData = [Environment]::GetFolderPath(\'LocalApplicationData\'); Join-Path $localAppData \'Packages\' | Join-Path -ChildPath $pkg.PackageFamilyName | Join-Path -ChildPath \'LocalState\' | Join-Path -ChildPath \'settings.json\' }"',
      { maxBuffer: 1024 * 1024 },
    ).toString().trim()
    if (!stdout) {
      return []
    }

    const raw = readFileSync(stdout, 'utf-8')
    const json = JSON.parse(raw)
    const list: Array<{ name: string, hidden?: boolean }> = json?.profiles?.list ?? []
    return list
      .filter(p => !p.hidden && p.name)
      .map(p => p.name)
  }
  catch (err) {
    logger.error('获取 Windows Terminal 配置失败:', err)
    return []
  }
}
