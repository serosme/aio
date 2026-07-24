const { contextBridge, ipcRenderer } = require('electron')

function onEvent(channel, callback) {
  const handler = (_event, ...args) => callback(...args)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

contextBridge.exposeInMainWorld('electronAPI', {
  asr: {
    onStart: cb => onEvent('asr-start', cb),
    onEnd: cb => onEvent('asr-end', cb),
    sendResult: data => ipcRenderer.send('asr-result', data),
  },
})
