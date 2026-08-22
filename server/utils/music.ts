import { join } from 'node:path'

export const musicDir = conf.get('music').path
export const musicPath = (id: string) => join(musicDir, id)
