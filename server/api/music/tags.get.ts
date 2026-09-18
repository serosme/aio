import { readTags } from 'taglib-wasm/simple'

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event) as { id: string }
  const tags = await readTags(musicPath(id))

  return {
    title: tags.title?.[0] || '',
    artist: tags.artist?.[0] || '',
    album: tags.album?.[0] || '',
    lyrics: tags.lyrics?.map(l => l.text).join('\n\n') || '',
  }
})
