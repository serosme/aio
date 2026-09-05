export default defineEventHandler((event) => {
  const { name } = getQuery(event) as { name: string }
  return conf.get(name as keyof AppConf)
})
