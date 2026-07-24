import type { CommandPaletteItem } from '@nuxt/ui'

export default function () {
  const { data } = useSelfFetch<{ name: string }[]>('/api/terminal', { default: () => [] })
  const items = computed<CommandPaletteItem[]>(() =>
    data.value.map(item => ({
      label: item.name,
      icon: 'i-lucide-terminal',
      onSelect: () => selfFetch('/api/terminal/open', { params: { name: item.name } }),
    })),
  )
  return { id: 'terminals', label: 'Terminals', order: 1, items }
}
