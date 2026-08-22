import { readFile } from 'node:fs/promises'
import { readTags } from 'taglib-wasm/simple'

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event) as { id: string }
  const buffer = await readFile(musicPath(id))
  const tags = await readTags(buffer)

  return {
    title: tags.title?.[0] || '',
    artist: tags.artist?.[0] || '',
    album: tags.album?.[0] || '',
  }
})
