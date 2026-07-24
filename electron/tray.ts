import path from 'node:path'
import { app, Menu, Tray } from 'electron'
import { getWindows } from './windows.ts'

let tray: Tray | null = null

export function createTray() {
  tray = new Tray(path.join(app.getAppPath(), './public/favicon.ico'))

  tray.on('click', () => {
    // no-op
  })

  updateTrayMenu()
  return tray
}

export function updateTrayMenu() {
  if (!tray)
    return

  const windows = getWindows()

  const windowItems = windows.map(({ name, win }) => {
    return {
      label: name,
      submenu: [
        {
          label: '显示',
          click: () => {
            if (win.isDestroyed())
              return
            win.show()
            win.focus()
          },
        },
        {
          label: '隐藏',
          click: () => {
            if (win.isDestroyed())
              return
            win.hide()
          },
        },
        { type: 'separator' as const },
        {
          label: '关闭',
          click: () => {
            if (win.isDestroyed())
              return
            win.close()
          },
        },
      ],
    }
  })

  const menuTemplate: Array<Electron.MenuItemConstructorOptions> = [
    ...windowItems,
    ...(windowItems.length > 0 ? [{ type: 'separator' as const }] : []),
    { label: '退出', click: () => { app.quit() } },
  ]

  tray.setContextMenu(Menu.buildFromTemplate(menuTemplate))
}

export function destroyTray() {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
