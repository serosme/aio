import { spawn } from 'node:child_process'

export default defineEventHandler((event) => {
  const { name } = getQuery(event) as { name: string }

  const id = getAppId(name)
  if (!id) {
    throw createError({ statusCode: 404, message: `App not found: ${name}` })
  }

  const child = spawn('explorer.exe', [`shell:AppsFolder\\${id}`], {
    detached: true,
    stdio: 'ignore',
  })
  child.unref()
})
