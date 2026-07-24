export const commandScripts: Record<string, string> = {
  'Update-All': 'scoop update; scoop update *; scoop cleanup *; winget update --all',
  'Update-Scoop': 'scoop update; scoop update *; scoop cleanup *',
  'Update-Winget': 'winget update --all',
}

export function getCommandNames(): { name: string }[] {
  return Object.keys(commandScripts).map(name => ({ name }))
}

export function getCommandScript(name: string): string | undefined {
  return commandScripts[name]
}
