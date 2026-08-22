import { readFile } from 'node:fs/promises'
import { readTags } from 'taglib-wasm/simple'

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event) as { id: string }
  const buffer = await readFile(musicPath(id))
  const tags = await readTags(buffer)
  const text = tags.lyrics?.map(l => l.text).join('\n\n') || ''
  return { text }
})
