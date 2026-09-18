import type { CommandPaletteItem } from '@nuxt/ui'

interface Command {
  label: string
  icon: string
  command?: string
  children?: Command[]
}

const commands: Command[] = [
  {
    label: 'Deepseek Harness',
    command: 'dsh web',
    icon: 'i-lucide-sparkles',
  },
  {
    label: 'Update',
    icon: 'i-lucide-arrow-up',
    children: [
      {
        label: 'Scoop',
        command: 'scoop update; scoop update *; scoop cleanup *',
        icon: 'i-lucide-app-window',
      },
      {
        label: 'Mise',
        command: 'mise upgrade; mise prune',
        icon: 'i-lucide-code',
      },
      {
        label: 'Npm',
        command: 'npm update -g',
        icon: 'i-lucide-package',
      },
      {
        label: 'Winget',
        command: 'winget update --all',
        icon: 'i-lucide-monitor',
      },
    ],
  },
]

function toCommandItem(command: Command): CommandPaletteItem {
  return {
    label: command.label,
    icon: command.icon,
    children: command.children?.map(toCommandItem),
    onSelect: command.command
      ? () => selfFetch('/api/command/open', { params: { command: command.command } })
      : undefined,
  }
}

export default function () {
  const items = computed<CommandPaletteItem[]>(() => commands.map(toCommandItem))
  return { id: 'commands', label: 'Commands', order: 2, items }
}
