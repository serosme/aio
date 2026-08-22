import { get } from 'node:http'
import process from 'node:process'

const port = Number(process.env.DEV_PORT ?? 2999)
const url = `http://localhost:${port}`

function attempt() {
  return new Promise((resolve) => {
    const req = get(url, (res) => {
      res.resume()
      resolve(res.statusCode < 500)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(1000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function main() {
  while (!(await attempt()))
    await new Promise(resolve => setTimeout(resolve, 500))
}

main()
