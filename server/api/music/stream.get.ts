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

  setHeader(event, 'Content-Type', mime[extname(id).toLowerCase()] || 'application/octet-stream')
  setHeader(event, 'Accept-Ranges', 'bytes')

  if (!range) {
    setHeader(event, 'Content-Length', size)
    return createReadStream(path)
  }

  const match = range.match(/^bytes=(\d+)-(\d*)$/)
  const start = match ? Number(match[1]) : Number.NaN
  const requestedEnd = match?.[2] ? Number(match[2]) : size - 1
  if (!match || !Number.isSafeInteger(start) || !Number.isSafeInteger(requestedEnd) || start >= size || requestedEnd < start) {
    throw createError({ statusCode: 400, message: '无效的 Range 请求' })
  }

  const end = Math.min(requestedEnd, size - 1)
  setResponseStatus(event, 206)
  setHeader(event, 'Content-Range', `bytes ${start}-${end}/${size}`)
  setHeader(event, 'Content-Length', end - start + 1)

  return createReadStream(path, { start, end })
})
