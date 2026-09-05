export default defineEventHandler((event) => {
  const { command } = getQuery(event) as { command?: string }

  if (!command) {
    return
  }

  openCommand(command)
})
