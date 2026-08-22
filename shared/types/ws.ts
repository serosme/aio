export interface ClientMessage {
  type: 'result'
  text: string
}

export type ServerMessage
  = | { type: 'voice-start' }
    | { type: 'voice-stop' }
    | { type: 'voice-result', text: string }
