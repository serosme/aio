import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

const mihomoDir = join(os.homedir(), '.config', 'aio', 'mihomo')
const exePath = join(mihomoDir, 'mihomo.exe')
const pidFile = join(mihomoDir, 'mihomo.pid')

function runElevatedPowerShell(script: string) {
  return spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], {
    timeout: 15_000,
    windowsHide: true,
    encoding: 'utf-8',
  })
}

async function readPid(): Promise<number | null> {
  try {
    const pidStr = (await readFile(pidFile, 'utf-8')).trim()
    const pid = Number(pidStr)
    if (!Number.isInteger(pid) || pid <= 0)
      return null
    try {
      process.kill(pid, 0)
    }
    catch (err: any) {
      if (err.code === 'EPERM')
        return pid
      return null
    }
    return pid
  }
  catch {
    return null
  }
}

export async function startMihomo(admin = false) {
  if (await readPid())
    return

  if (!existsSync(mihomoDir)) {
    mkdirSync(mihomoDir, { recursive: true })
  }

  if (admin) {
    const esc = (s: string) => s.replace(/'/g, '\'\'')
    runElevatedPowerShell([
      `$psi = New-Object System.Diagnostics.ProcessStartInfo`,
      `$psi.FileName = '${esc(exePath)}'`,
      `$psi.Arguments = ''`,
      `$psi.Verb = 'runas'`,
      `$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden`,
      `$psi.WorkingDirectory = '${esc(mihomoDir)}'`,
      `$psi.UseShellExecute = $true`,
      `$p = [System.Diagnostics.Process]::Start($psi)`,
      `$p.Id | Out-File -FilePath '${esc(pidFile)}' -Encoding utf8`,
    ].join('; '))
  }
  else {
    const child = spawn(exePath, [], {
      detached: true,
      stdio: 'ignore',
      cwd: mihomoDir,
    })
    child.unref()
    await writeFile(pidFile, String(child.pid!), 'utf-8')
  }
}

export async function stopMihomo() {
  const pid = await readPid()
  if (!pid)
    return

  try {
    process.kill(pid)
  }
  catch {
    runElevatedPowerShell(
      `Start-Process -FilePath "taskkill" -ArgumentList '/F','/PID','${pid}' -Verb RunAs -WindowStyle Hidden -Wait`,
    )
  }

  await unlink(pidFile)
}

export async function getMihomoStatus() {
  const pid = await readPid()
  return { running: pid !== null, pid }
}

export function available() {
  return { available: existsSync(exePath) }
}
