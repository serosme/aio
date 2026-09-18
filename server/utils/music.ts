import { basename, extname, join } from 'node:path'

const musicExts = new Set(['.mp3', '.flac'])

export const musicDir = conf.get('music').path

export function musicPath(id: string): string {
  if (typeof id !== 'string' || !id || basename(id) !== id || !musicExts.has(extname(id).toLowerCase())) {
    throw createError({
      statusCode: 400,
      message: '无效的音乐文件',
    })
  }

  return join(musicDir, id)
}
