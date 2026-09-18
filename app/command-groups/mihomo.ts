import type { CommandPaletteItem } from '@nuxt/ui'

export default function () {
  const items = computed<CommandPaletteItem[]>(() => [
    {
      label: 'Mihomo',
      icon: 'i-lucide-shield',
      keywords: ['开启', '关闭', 'tun', 'start', 'stop'],
      children: [
        {
          label: 'TUN 开启',
          icon: 'i-lucide-shield',
          onSelect: () => selfFetch('/api/mihomo/start', { params: { tun: 'true' } }),
        },
        {
          label: '关闭',
          icon: 'i-lucide-square',
          onSelect: () => selfFetch('/api/mihomo/stop'),
        },
        {
          label: '开启',
          icon: 'i-lucide-play',
          onSelect: () => selfFetch('/api/mihomo/start', { params: { tun: 'false' } }),
        },
      ],
    },
  ])
  return { id: 'mihomo', label: 'Mihomo', order: 3, items }
}
