import { execSync, spawn, spawnSync } from 'node:child_process'

const services: ServiceItem[] = [
  {
    id: 'dsh',
    name: 'DeepSeek Harness',
    command: 'dsh web',
    port: 3080,
  },
]

export function getServices(): ServiceItem[] {
  return services
}

export function getService(id: string): ServiceItem {
  return services.find(s => s.id === id)!
}

function serviceUrl(service: ServiceItem): string {
  return `http://127.0.0.1:${service.port}`
}

export async function isServiceRunning(service: ServiceItem): Promise<boolean> {
  try {
    // 任意 HTTP 响应（含 4xx/5xx）都视为服务在运行
    await fetch(serviceUrl(service), { signal: AbortSignal.timeout(1000) })
    return true
  }
  catch {
    return false
  }
}

export function startService(service: ServiceItem) {
  // shell: true 由 Node 内部经 cmd.exe /d /s /c 执行，windowsHide 隐藏控制台窗口；
  // 不要加 detached —— Windows 上 detached 会强制新建控制台窗口，windowsHide 失效
  const child = spawn(service.command, {
    shell: true,
    stdio: 'ignore',
    windowsHide: true,
  })
  logger.info(`[service:${service.id}] 启动成功: ${service.command}`)
  child.on('error', (err) => {
    logger.error(`[service:${service.id}] 启动失败:`, err)
  })
  child.unref()
}

function getPidByPort(port: number): number | undefined {
  const out = execSync('netstat -ano', { encoding: 'utf-8', windowsHide: true, timeout: 5000 })
  for (const line of out.split(/\r?\n/)) {
    const m = line.trim().match(/^TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)$/)
    if (m && Number(m[1]) === port)
      return Number(m[2])
  }
}

export function stopService(service: ServiceItem) {
  const pid = getPidByPort(service.port)
  if (!pid)
    return
  // /T 按进程树强杀，避免遗漏 cmd.exe 壳进程
  const result = spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true })
  if (result.status !== 0)
    logger.error(`[service:${service.id}] 停止失败: pid ${pid}`)
  else
    logger.info(`[service:${service.id}] 已停止 (pid ${pid})`)
}
