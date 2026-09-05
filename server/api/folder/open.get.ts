export default defineEventHandler((event) => {
  const { name } = getQuery(event) as { name?: string }
  if (!name)
    throw createError({ statusCode: 400, message: '缺少文件夹名称' })
  openProcess('explorer.exe', [getFolderPath(name)])
})
