import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'

function run(cmd: string): void {
  execSync(cmd, { encoding: 'utf-8', stdio: 'inherit' })
}

function releaseExists(tag: string): boolean {
  try {
    execSync(`gh release view ${tag}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
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

  run('git update-ref -d HEAD')
  run('git add -A')
  run(`git commit -m "feat: init"`)
  run('git push --force')

  run('git tag --force latest')
  run('git push --force origin latest')
  if (releaseExists('latest')) {
    run('gh release delete latest --yes')
  }
  run(`gh release create latest --title "" --notes "" "${zipPath}"`)
}

async function writeManifest(path: string, ver: string, hash: string): Promise<void> {
  const m = JSON.parse(await readFile(path, 'utf-8'))
  m.version = ver
  m.architecture['64bit'].hash = hash
  await writeFile(path, `${JSON.stringify(m, null, 2)}\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
