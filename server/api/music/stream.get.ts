import { createReadStream, statSync } from 'node:fs'
import { extname } from 'node:path'

const mime: Record<string, string> = {
  '.flac': 'audio/flac',
  '.mp3': 'audio/mpeg',
}

export default defineEventHandler((event) => {
  const { id } = getQuery(event) as { id: string }
  const path = musicPath(id)
  const size = statSync(path).size
  const range = getHeader(event, 'range')

  setHeader(event, 'Content-Type', mime[extname(id)] || 'application/octet-stream')
  setHeader(event, 'Accept-Ranges', 'bytes')

  if (!range) {
    setHeader(event, 'Content-Length', size)
    return createReadStream(path)
  }

  const [, startStr, endStr] = range.match(/bytes=(\d+)-(\d*)/) || []
  const start = Number(startStr)
  const end = endStr ? Number(endStr) : size - 1

  setResponseStatus(event, 206)
  setHeader(event, 'Content-Range', `bytes ${start}-${end}/${size}`)
  setHeader(event, 'Content-Length', end - start + 1)

  return createReadStream(path, { start, end })
})
