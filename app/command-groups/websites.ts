import type { CommandPaletteItem } from '@nuxt/ui'

const origin = window.location.origin

const websites = [
  { name: 'Chat', url: `${origin}/chat`, icon: 'i-lucide-message-circle' },
  { name: 'Music', url: `${origin}/music`, icon: 'i-lucide-music' },
  { name: 'Test', url: `${origin}/test`, icon: 'i-lucide-flask-conical' },
]

export default function () {
  const items = computed<CommandPaletteItem[]>(() =>
    websites.map(site => ({
      label: site.name,
      icon: site.icon,
      onSelect: () => window.electronAPI?.openWindow({
        name: site.name,
        url: site.url,
      }),
    })),
  )
  return { id: 'websites', label: 'Websites', order: 1, items }
}
