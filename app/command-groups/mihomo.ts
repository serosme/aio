import type { CommandPaletteItem } from '@nuxt/ui'

export default function () {
  const { data, refresh } = useSelfFetch<{ name: string }[]>('/api/mihomo', { default: () => [] })

  const iconMap: Record<string, string> = {
    'start': 'i-lucide-play',
    'start-tun': 'i-lucide-shield',
    'stop': 'i-lucide-square',
  }

  const items = computed<CommandPaletteItem[]>(() =>
    data.value.map(item => ({
      label: item.name,
      icon: iconMap[item.name] ?? 'i-lucide-circle',
      onSelect: () => selfFetch('/api/mihomo/open', { params: { name: item.name } }).then(refresh),
    })),
  )

  return { id: 'mihomo', label: 'Mihomo', order: 0, items }
}
