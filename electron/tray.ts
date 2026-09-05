import path from 'node:path'
import { app, Menu, Tray } from 'electron'
import { getWindows } from './windows.ts'

let tray: Tray | null = null

export function createTray() {
  tray = new Tray(path.join(app.getAppPath(), './public/favicon.ico'))

  tray.on('click', () => {
    // 覆盖默认单击行为：禁用单击弹出窗口
  })

  updateTrayMenu()
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
            win.show()
            win.focus()
          },
        },
        {
          label: '隐藏',
          click: () => {
            win.hide()
          },
        },
        { type: 'separator' as const },
        {
          label: '关闭',
          click: () => {
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
