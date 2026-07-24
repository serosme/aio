import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'

function run(cmd: string): void {
  execSync(cmd, { encoding: 'utf-8', stdio: 'inherit' })
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

const now = new Date()
const version = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`

async function main(): Promise<void> {
  const zipPath = join('release', 'Aio-win-x64.zip')
  const hash = createHash('sha256').update(await readFile(zipPath)).digest('hex')

  await writeManifest('aio.json', version, hash)
  await gitPushManifest('aio.json', version)
  await releaseToGithub(zipPath, version)
}

async function writeManifest(path: string, ver: string, hash: string): Promise<void> {
  const m = JSON.parse(await readFile(path, 'utf-8'))
  m.version = ver
  m.architecture['64bit'].hash = hash
  await writeFile(path, `${JSON.stringify(m, null, 2)}\n`)
}

async function gitPushManifest(path: string, ver: string): Promise<void> {
  run(`git add ${path}`)
  run(`git commit -m "chore: bump scoop manifest to ${ver}"`)
  run('git push')
}

async function releaseToGithub(zip: string, ver: string): Promise<void> {
  for (const cmd of ['gh release delete latest --yes --cleanup-tag', 'git push origin :refs/tags/latest', 'git tag -d latest']) {
    try {
      run(cmd)
    }
    catch {}
  }

  run('git tag latest')
  run('git push origin latest')
  run(`gh release create latest --title "${ver}" --notes "" "${zip}"`)
}

main().catch(() => process.exit(1))
