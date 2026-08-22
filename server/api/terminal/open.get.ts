export default defineEventHandler((event) => {
  const { name } = getQuery(event) as { name: string }
  openProcess('wt.exe', ['-p', name])
})
