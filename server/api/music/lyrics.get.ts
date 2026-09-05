import { readTags } from 'taglib-wasm/simple'

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event) as { id: string }
  const tags = await readTags(musicPath(id))
  const text = tags.lyrics?.map(l => l.text).join('\n\n') || ''
  return { text }
})
