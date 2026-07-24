export default defineEventHandler((event) => {
  const { name } = getQuery(event)

  if (!name || !conf.has(name as keyof AppConf)) {
    throw createError({ message: 'Conf not found' })
  }

  return conf.get(name as keyof AppConf)
})
