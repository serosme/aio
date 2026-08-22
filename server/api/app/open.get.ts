export default defineEventHandler((event) => {
  const { name } = getQuery(event) as { name: string }
  const id = getAppId(name)
  openProcess('explorer.exe', [`shell:AppsFolder\\${id}`])
})
