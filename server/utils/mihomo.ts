import { execSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { join } from 'node:path'
import merge from 'deepmerge'
import { dump, load } from 'js-yaml'

const mihomoDir = join(os.homedir(), '.config', 'aio', 'mihomo')
const exePath = join(mihomoDir, 'mihomo.exe')

function runElevatedPowerShell(script: string) {
  return spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], {
    timeout: 15_000,
    windowsHide: true,
    encoding: 'utf-8',
  })
}

function isRunning(): boolean {
  try {
    const out = execSync('tasklist /NH /FO CSV /FI "IMAGENAME eq mihomo.exe"', {
      encoding: 'utf-8',
      windowsHide: true,
      timeout: 3000,
    })
    return out.includes('mihomo.exe')
  }
  catch {
    return false
  }
}

function mergeConfig() {
  const providerPath = join(mihomoDir, 'provider.yaml')
  if (!existsSync(providerPath))
    return

  const provider = load(readFileSync(providerPath, 'utf-8')) as Record<string, any>

  const customPath = join(mihomoDir, 'custom.yaml')
  if (existsSync(customPath)) {
    const custom = load(readFileSync(customPath, 'utf-8')) as Record<string, any>
    const merged = merge(provider, custom, { arrayMerge: (target, source) => source.concat(target) })
    writeFileSync(join(mihomoDir, 'config.yaml'), dump(merged), 'utf-8')
    return
  }

  writeFileSync(join(mihomoDir, 'config.yaml'), dump(provider), 'utf-8')
}

export function startMihomo(tun = false) {
  if (isRunning() || !existsSync(exePath))
    return
  if (!existsSync(mihomoDir))
    mkdirSync(mihomoDir, { recursive: true })
  mergeConfig()
  const esc = (s: string) => s.replace(/'/g, '\'\'')
  const lines = [
    `$psi = New-Object System.Diagnostics.ProcessStartInfo`,
    `$psi.FileName = '${esc(exePath)}'`,
    `$psi.Arguments = '-d .'`,
  ]
  if (tun)
    lines.push(`$psi.Verb = 'runas'`)
  lines.push(
    `$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden`,
    `$psi.WorkingDirectory = '${esc(mihomoDir)}'`,
    `$psi.UseShellExecute = $true`,
    `[System.Diagnostics.Process]::Start($psi)`,
  )
  runElevatedPowerShell(lines.join('; '))
}

export function stopMihomo() {
  if (!isRunning())
    return
  const result = spawnSync('taskkill', ['/F', '/IM', 'mihomo.exe'], { windowsHide: true })
  if (result.status !== 0 && isRunning()) {
    runElevatedPowerShell(
      `Start-Process -FilePath "taskkill" -ArgumentList '/F','/IM','mihomo.exe' -Verb RunAs -WindowStyle Hidden -Wait`,
    )
  }
}
