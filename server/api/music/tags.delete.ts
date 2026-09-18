import { readFile, writeFile } from 'node:fs/promises'
import { clearTags } from 'taglib-wasm/simple'

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event) as { id: string }
  const buffer = await readFile(musicPath(id))
  const stripped = await clearTags(buffer)
  await writeFile(musicPath(id), stripped)

  return { success: true }
})
