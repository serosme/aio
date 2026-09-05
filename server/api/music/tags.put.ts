import { getTagLib } from 'taglib-wasm/simple'

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event) as { id: string }
  const body = await readBody(event) as { title?: string, artist?: string, album?: string, lyrics?: string }
  const path = musicPath(id)

  const taglib = await getTagLib()
  await taglib.edit(path, (audioFile) => {
    audioFile.tag()
      .setTitle(body.title || '')
      .setArtist(body.artist || '')
      .setAlbum(body.album || '')
    audioFile.setLyrics(body.lyrics ? [{ text: body.lyrics }] : [])
  })

  return { success: true }
})
