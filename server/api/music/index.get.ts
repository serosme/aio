import { readdir } from 'node:fs/promises'
import { extname } from 'node:path'
import { readMetadata } from 'taglib-wasm/simple'

const exts = new Set(['.mp3', '.flac'])

export default defineEventHandler(async (): Promise<Music[]> => {
  const result: Music[] = []

  const files = (await readdir(musicDir)).sort()

  for (const file of files) {
    if (!exts.has(extname(file).toLowerCase()))
      continue

    const metadata = await readMetadata(musicPath(file))
    const tags = metadata.tags

    result.push({
      id: file,
      index: result.length,
      title: tags.title?.[0] || '未知歌曲',
      artist: tags.artist?.[0] || '未知艺术家',
      duration: metadata.properties!.duration,
    })
  }
  return result
})
