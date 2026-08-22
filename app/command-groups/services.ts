import type { CommandPaletteItem } from '@nuxt/ui'

export default function () {
  const { data } = useSelfFetch<ServiceItem[]>('/api/service', { default: () => [] })

  const items = computed<CommandPaletteItem[]>(() =>
    data.value.map(service => ({
      label: service.name,
      icon: 'i-lucide-server',
      children: [
        {
          label: '启动',
          icon: 'i-lucide-play',
          onSelect: () => selfFetch('/api/service/start', { params: { id: service.id } }),
        },
        {
          label: '停止',
          icon: 'i-lucide-square',
          onSelect: () => selfFetch('/api/service/stop', { params: { id: service.id } }),
        },
      ],
    })),
  )
  return { id: 'services', label: 'Services', items }
}
