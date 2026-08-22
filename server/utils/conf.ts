import os from 'node:os'
import path from 'node:path'
import Conf from 'conf'

const confSchema = {
  asr: {
    type: 'object',
    properties: {
      key: { type: 'string' },
    },
    default: {
      key: '',
    },
  },
  music: {
    type: 'object',
    properties: {
      path: { type: 'string' },
    },
    default: {
      path: '',
    },
  },
} satisfies Record<keyof AppConf, unknown>

const conf = new Conf<AppConf>({
  cwd: path.join(os.homedir(), '.config', 'aio'),
  schema: confSchema,
  defaults: {
    asr: { key: '' },
    music: { path: path.join(os.homedir(), 'Music') },
  },
})

export default conf
