import type { CommandPaletteItem } from '@nuxt/ui'

export default function () {
  const { data } = useSelfFetch<{ name: string }[]>('/api/command', { default: () => [] })
  const items = computed<CommandPaletteItem[]>(() =>
    data.value.map(cmd => ({
      label: cmd.name,
      icon: 'i-lucide-square-terminal',
      onSelect: () => selfFetch('/api/command/open', { params: { name: cmd.name } }),
    })),
  )
  return { id: 'commands', label: 'Commands', order: 3, items }
}
