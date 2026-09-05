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
  const tags = await readTags(musicPath(id))

  return sanitize(tags)
})
