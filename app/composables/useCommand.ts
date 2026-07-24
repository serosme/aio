import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui'
import type { ComputedRef } from 'vue'

type CommandGroupFactory = () => {
  id: string
  label: string
  order?: number
  items: ComputedRef<CommandPaletteItem[]>
}

const groupFactories = import.meta.glob<CommandGroupFactory>(
  '../command-groups/*.ts',
  { eager: true, import: 'default' },
)

export function useCommand() {
  const setups = Object.values(groupFactories).map(fn => fn())

  const searchTerm = ref('')
  const paletteKey = ref(0)
  function resetPalette() {
    searchTerm.value = ''
    nextTick(() => {
      paletteKey.value++
    })
  }

  const groups = computed<CommandPaletteGroup[]>(() =>
    [...setups]
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      .map(s => ({
        id: s.id,
        label: s.label,
        items: s.items.value,
      })),
  )

  const resultLimit = computed(() =>
    groups.value.find(g => g.id === 'terminals')?.items?.length ?? 0,
  )

  return {
    searchTerm,
    paletteKey,
    resetPalette,
    groups,
    resultLimit,
  }
}
