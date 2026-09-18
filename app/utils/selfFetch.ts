export const selfFetch = $fetch.create({
  onResponseError({ response }) {
    useToast().add({
      color: 'error',
      title: response.statusText,
      description: response._data.message,
    })
  },
  onRequestError({ error }) {
    useToast().add({
      color: 'error',
      title: error.name,
      description: error.message,
    })
  },
})
