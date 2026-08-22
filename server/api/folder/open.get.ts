export default defineEventHandler((event) => {
  const { name } = getQuery(event) as { name: string }
  openProcess('explorer.exe', [getFolderPath(name)])
})
