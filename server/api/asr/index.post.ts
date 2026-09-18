import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { gunzipSync, gzipSync } from 'node:zlib'

export default defineEventHandler(async (event) => {
  const audio = await readRawBody(event, false)
  if (!audio?.length) {
    throw createError({
      statusCode: 400,
      message: '无效音频',
    })
  }

  const { key } = conf.get('asr')
  if (!key) {
    throw createError({
      statusCode: 400,
      message: '密钥未找到',
    })
  }

  const text = await requestAsr(audio, key)
  if (!text) {
    throw createError({
      statusCode: 400,
      message: '识别失败',
    })
  }

  return { text }
})

// 火山引擎豆包大模型流式语音识别：流式输入音频，返回整句结果
function requestAsr(audio: Buffer, apiKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Node 内置 WebSocket（undici）支持用第二个参数传入请求头，标准类型定义里没有这个扩展
    const socket = new WebSocket('wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_nostream', {
      headers: {
        'X-Api-Key': apiKey,
        'X-Api-Resource-Id': 'volc.seedasr.sauc.duration', // 豆包流式语音识别模型 2.0 小时版
        'X-Api-Request-Id': randomUUID(),
      },
    } as unknown as string[])
    socket.binaryType = 'arraybuffer'

    let text = ''
    let sequence = 2 // 1 已被 full client request 占用
    let sending = false
    let settled = false
    const timer = setTimeout(
      () => finish(new Error('识别超时')),
      audio.length / 32 + 20_000, // 音频时长（16000Hz × 2 字节）+ 20 秒余量
    )

    function finish(error?: Error): void {
      if (settled)
        return
      settled = true
      clearTimeout(timer)
      socket.close()
      if (error) {
        logger.error(`[asr] ${error.message}`)
        reject(error)
      }
      else {
        resolve(text)
      }
    }

    async function sendAudio(): Promise<void> {
      // 每包 200ms：16000Hz × 2 字节 × 0.2s = 6400 字节
      for (let offset = 0; offset < audio.length; offset += 6400) {
        const end = Math.min(offset + 6400, audio.length)
        const frame = buildAudioRequest(sequence, audio.subarray(offset, end), end === audio.length)
        // WebSocket.send 的类型定义只认 BufferSource，运行时 Buffer 也能直接发
        socket.send(frame as unknown as BufferSource)
        if (end === audio.length)
          return
        sequence += 1
        await delay(0) // 让出事件循环，边发边收
      }
    }

    socket.onopen = () => {
      const frame = buildFullClientRequest(1, {
        // 与 electron/asr.ts 的录音参数一致
        audio: {
          format: 'pcm', // 裸 PCM，不带容器头
          codec: 'raw', // 不压缩
          rate: 16000, // 采样率 16kHz
          bits: 16, // 位深 16bit
          channel: 1, // 单声道
        },
        request: {
          model_name: 'bigmodel', // 目前仅支持这个模型名
          enable_itn: true, // 默认开启：口语数字、金额、日期转规范书面格式
          enable_punc: true, // 默认开启：加标点
          enable_ddc: true, // 默认关闭：开启后去掉停顿词、语气词、重复词
          force_to_speech_time: 1000, // 默认 0：起始强制按有声处理 1 秒，避免开头弱音被判停
        },
      })
      socket.send(frame as unknown as BufferSource)
    }

    socket.onmessage = (event) => {
      const frame = parseFrame(Buffer.from(event.data as ArrayBuffer))
      if (frame.code !== 0) {
        finish(new Error(`识别失败: ${readMessage(frame.body)}`))
        return
      }

      // 服务端确认 full client request 后再发送音频
      if (!sending) {
        sending = true
        void sendAudio().catch(finish)
      }

      const result = readText(frame.body)
      if (result)
        text = result
      if (frame.isLastPackage)
        finish()
    }

    socket.onerror = () => logger.error('[asr] WebSocket 连接异常')
    socket.onclose = (event) => {
      if (text) {
        finish()
      }
      else {
        finish(new Error(`连接已关闭(${event.code})`))
      }
    }
  })
}

// header：版本 1 | 头长 1、消息类型 | flags、JSON | gzip、保留
function buildFrame(messageType: number, flags: number, sequence: number, body: Buffer): Buffer {
  const frame = Buffer.alloc(12 + body.length)
  frame.writeUInt8(0x11, 0)
  frame.writeUInt8((messageType << 4) | flags, 1)
  frame.writeUInt8(0b0001_0001, 2)
  frame.writeInt32BE(sequence, 4)
  frame.writeUInt32BE(body.length, 8)
  body.copy(frame, 12)
  return frame
}

// full client request：消息类型 0b0001、flags 0b0001（带 payload_sequence）
function buildFullClientRequest(sequence: number, payload: unknown): Buffer {
  return buildFrame(0b0001, 0b0001, sequence, gzipSync(Buffer.from(JSON.stringify(payload))))
}

// audio only request：消息类型 0b0010，末包 flags 0b0011 且序号取负
function buildAudioRequest(sequence: number, chunk: Buffer, isLast: boolean): Buffer {
  return buildFrame(0b0010, isLast ? 0b0011 : 0b0001, isLast ? -sequence : sequence, gzipSync(chunk))
}

interface ServerFrame {
  code: number
  isLastPackage: boolean
  body: unknown
}

function parseFrame(frame: Buffer): ServerFrame {
  const headerLength = (frame.readUInt8(0) & 0x0F) * 4
  const messageType = frame.readUInt8(1) >> 4
  const flags = frame.readUInt8(1) & 0x0F
  const serialization = frame.readUInt8(2) >> 4
  const compression = frame.readUInt8(2) & 0x0F

  let payload = frame.subarray(headerLength)
  if (flags & 0b0001) // payload_sequence
    payload = payload.subarray(4)
  const isLastPackage = (flags & 0b0010) !== 0 // 末包

  let code = 0
  if (messageType === 0b1001) { // full server response
    payload = payload.subarray(4) // payload size
  }
  else if (messageType === 0b1111) { // error response
    code = payload.readInt32BE(0)
    payload = payload.subarray(8) // code + payload size
  }

  if (compression === 0b0001) // gzip
    payload = gunzipSync(payload)

  const content = payload.toString('utf8')
  return {
    code,
    isLastPackage,
    body: serialization === 0b0001 && content ? JSON.parse(content) : content, // JSON
  }
}

function readText(body: unknown): string {
  return (body as { result?: { text?: string } } | undefined)?.result?.text ?? ''
}

function readMessage(body: unknown): string {
  if (typeof body === 'string')
    return body
  return JSON.stringify(body)
}
