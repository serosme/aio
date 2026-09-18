export interface AsrConf {
  key: string
}

export interface MusicConf {
  path: string
}

export interface ChatConf {
  baseUrl: string
  apiKey: string
}

export interface AppConf {
  asr: AsrConf
  music: MusicConf
  chat: ChatConf
}
