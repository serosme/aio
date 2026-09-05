export default defineEventHandler((event) => {
  const { name } = getQuery(event) as { name?: string }
  if (!name)
    throw createError({ statusCode: 400, message: '缺少应用名称' })
  const id = getAppId(name)
  openProcess('explorer.exe', [`shell:AppsFolder\\${id}`])
})
