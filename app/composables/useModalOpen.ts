export function useModalOpen(
  props: { open: boolean },
  emit: (evt: 'update:open', value: boolean) => void,
  onOpen?: () => void,
) {
  const open = ref(props.open)
  watch(() => props.open, (v) => {
    open.value = v
    if (v)
      onOpen?.()
  })
  watch(open, v => emit('update:open', v))
  return open
}
