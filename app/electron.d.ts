interface ElectronAPI {
  asr: {
    onStart: (cb: (message: string) => void) => () => void
    onEnd: (cb: () => void) => () => void
    sendResult: (data: string) => void
  }
}

interface Window { electronAPI: ElectronAPI }
