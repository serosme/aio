import type { CommandPaletteItem } from '@nuxt/ui'
import { pinyin } from 'pinyin-pro'

export default function () {
  const { data } = useSelfFetch<{ name: string }[]>('/api/app', { default: () => [] })
  const items = computed<CommandPaletteItem[]>(() =>
    data.value.map(app => ({
      label: app.name,
      icon: 'i-lucide-app-window',
      keywords: app.name
        ? [
            pinyin(app.name, { toneType: 'none', separator: '' }),
            pinyin(app.name, { pattern: 'first', toneType: 'none', separator: '' }),
          ]
        : undefined,
      onSelect: () => selfFetch('/api/app/open', { params: { name: app.name } }),
    })),
  )
  return { id: 'applications', label: 'Applications', items }
}
