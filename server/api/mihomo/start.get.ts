export default defineEventHandler((event) => {
  const { tun } = getQuery(event)
  startMihomo(tun === 'true')
})
