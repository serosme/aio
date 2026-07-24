import os from 'node:os'
import path from 'node:path'
import Conf from 'conf'

export const confSchema = {
  asr: {
    type: 'object',
    properties: {
      key: { type: 'string' },
    },
    default: {
      key: '',
    },
  },
} satisfies Record<keyof AppConf, unknown>

const conf = new Conf<AppConf>({
  cwd: path.join(os.homedir(), '.config', 'aio'),
  schema: confSchema,
})

export default conf
