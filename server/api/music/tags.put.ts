import { readFile, writeFile } from 'node:fs/promises'
import { applyTags } from 'taglib-wasm/simple'

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event) as { id: string }
  const body = await readBody(event) as { title?: string, artist?: string, album?: string }
  const path = musicPath(id)

  const buffer = await readFile(path)
  const modified = await applyTags(buffer, {
    title: body.title || '',
    artist: body.artist || '',
    album: body.album || '',
  })
  await writeFile(path, modified)

  return { success: true }
})
