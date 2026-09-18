const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  openWindow: payload => ipcRenderer.invoke('window:open', payload),
})
