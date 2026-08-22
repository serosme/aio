export default defineEventHandler((): { name: string }[] => {
  return getFolderNames()
})
