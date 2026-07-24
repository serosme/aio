import { spawn } from 'node:child_process'

export default defineEventHandler((event) => {
  const { name } = getQuery(event) as { name: string }

  const child = spawn('wt.exe', ['-p', name], {
    detached: true,
    stdio: 'ignore',
  })
  child.unref()
})
