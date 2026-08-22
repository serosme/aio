import { readdir, readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import { readProperties, readTags } from 'taglib-wasm/simple'

const exts = new Set(['.mp3', '.flac'])

export default defineEventHandler(async (): Promise<Music[]> => {
  const result: Music[] = []

  const files = await readdir(musicDir)

  for (const file of files) {
    if (!exts.has(extname(file).toLowerCase()))
      continue

    const buffer = await readFile(musicPath(file))
    const properties = await readProperties(buffer)
    const tags = await readTags(buffer)

    result.push({
      id: file,
      index: result.length,
      title: tags.title?.[0] || '未知歌曲',
      artist: tags.artist?.[0] || '未知艺术家',
      duration: properties.duration,
    })
  }
  return result
})
