import type { CommandPaletteItem } from '@nuxt/ui'

const origin = window.location.origin

const websites = [
  { name: 'DeepSeek Harness', url: 'http://127.0.0.1:3080/', icon: 'i-lucide-sparkles' },
  { name: 'Music', url: `${origin}/music`, icon: 'i-lucide-music' },
  { name: 'ASR', url: `${origin}/asr`, icon: 'i-lucide-mic' },
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
