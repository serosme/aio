import { readFile } from 'node:fs/promises'
import { readTags } from 'taglib-wasm/simple'

function sanitize(value: unknown): unknown {
  if (value instanceof Uint8Array || value instanceof ArrayBuffer)
    return `<binary ${value.byteLength} bytes>`
  if (Array.isArray(value))
    return value.map(sanitize)
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitize(v)]))
  return value
}

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event) as { id: string }
  const buffer = await readFile(musicPath(id))
  const tags = await readTags(buffer)

  return sanitize(tags)
})
