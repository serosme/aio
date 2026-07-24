export default defineEventHandler(async (event) => {
  const { name } = getQuery(event) as { name: string }

  switch (name) {
    case 'start':
      await startMihomo(false)
      break
    case 'start-tun':
      await startMihomo(true)
      break
    case 'stop':
      await stopMihomo()
      break
  }
})
