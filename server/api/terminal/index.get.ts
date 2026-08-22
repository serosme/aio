export default defineEventHandler((): { name: string }[] => {
  return getTerminalProfiles().map(name => ({ name }))
})
