export interface ElectronAPI {
  openWindow: (payload: { name: string, url: string }) => Promise<void>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
