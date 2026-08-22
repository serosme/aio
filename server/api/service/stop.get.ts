export default defineEventHandler(async (event) => {
  const { id } = getQuery(event) as { id: string }
  const service = getService(id)
  if (!(await isServiceRunning(service))) {
    throw createError({
      statusCode: 400,
      message: '服务已停止',
    })
  }
  stopService(service)
})
