export default defineEventHandler((): { name: string }[] => {
  return getAppNames()
})
