import type { CommandPaletteItem } from '@nuxt/ui'

export default function () {
  const items = computed<CommandPaletteItem[]>(() => [
    {
      label: '开启 mihomo',
      icon: 'i-lucide-play',
      children: [
        {
          label: 'tun 开启',
          icon: 'i-lucide-shield',
          onSelect: () => selfFetch('/api/mihomo/start', { params: { tun: 'true' } }),
        },
        {
          label: 'tun 关闭',
          icon: 'i-lucide-play',
          onSelect: () => selfFetch('/api/mihomo/start', { params: { tun: 'false' } }),
        },
      ],
    },
    {
      label: '关闭 mihomo',
      icon: 'i-lucide-square',
      onSelect: () => selfFetch('/api/mihomo/stop'),
    },
  ])
  return { id: 'mihomo', label: 'Mihomo', items }
}
