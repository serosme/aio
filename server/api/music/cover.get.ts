import { readFile } from 'node:fs/promises'
import { findPictureByType, readPictures } from 'taglib-wasm/simple'

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event) as { id: string }
  const buffer = await readFile(musicPath(id))
  const pictures = await readPictures(buffer)
  const picture = findPictureByType(pictures, 'FrontCover') || pictures[0]

  if (!picture) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No cover art',
    })
  }

  setHeader(event, 'Content-Type', picture.mimeType)
  setHeader(event, 'Cache-Control', 'public, max-age=31536000')
  return picture.data
})
