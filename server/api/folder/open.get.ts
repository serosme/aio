import { spawn } from 'node:child_process'

export default defineEventHandler((event) => {
  const { name } = getQuery(event) as { name: string }

  const folderPath = getFolderPath(name)
  if (!folderPath) {
    throw createError({ statusCode: 404, message: `Folder not found: ${name}` })
  }

  const child = spawn('explorer.exe', [folderPath], {
    detached: true,
    stdio: 'ignore',
  })
  child.unref()
})
