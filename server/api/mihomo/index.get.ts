export default defineEventHandler(async () => {
  const result = await available()
  if (!result.available)
    return []

  const { running } = await getMihomoStatus()
  if (running)
    return [{ name: 'stop' }]
  return [{ name: 'start' }, { name: 'start-tun' }]
})
