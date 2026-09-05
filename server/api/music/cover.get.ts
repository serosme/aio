import { findPictureByType, readPictures } from 'taglib-wasm/simple'

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event) as { id: string }
  const pictures = await readPictures(musicPath(id))
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
