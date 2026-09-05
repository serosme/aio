interface ModelListResponse {
  data?: Array<{ id?: string }>
}

export default defineEventHandler(async () => {
  const { baseUrl, apiKey } = conf.get('chat')

  const response = await $fetch<ModelListResponse>(`${baseUrl.replace(/\/$/, '')}/models`, {
    headers: apiKey
      ? { Authorization: `Bearer ${apiKey}` }
      : undefined,
  })

  return (response.data ?? [])
    .filter(model => model.id)
    .sort((a, b) => a.id!.localeCompare(b.id!))
    .map(model => ({
      label: model.id,
      value: model.id,
    }))
})
