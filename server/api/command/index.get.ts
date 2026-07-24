export default defineEventHandler((): { name: string }[] => {
  return getCommandNames()
})
