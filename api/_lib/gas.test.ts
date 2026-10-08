import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { gasRegister } from './gas'

// Mimics Apps Script: POST /exec → 302 to /echo, which serves the JSON on GET.
let server: Server
let lastBody = ''
let reply: unknown = { status: 'created', id: 'r1', code: 'K7QX' }

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === '/exec' && req.method === 'POST') {
      let data = ''
      req.on('data', (c) => (data += c))
      req.on('end', () => {
        lastBody = data
        res.writeHead(302, { Location: '/echo' }).end()
      })
    } else if (req.url === '/echo' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(reply))
    } else if (req.url === '/html') {
      res.writeHead(200, { 'Content-Type': 'text/html' }).end('<html>Sign in</html>')
    } else res.writeHead(404).end()
  })
  await new Promise<void>((r) => server.listen(0, r))
  process.env.GAS_SECRET = 'top-secret'
})
afterAll(() => server.close())

const base = () => `http://127.0.0.1:${(server.address() as AddressInfo).port}`
const payload = { full_name: 'A B', phone: '08012345678', email: 'a@b.co' } as Parameters<typeof gasRegister>[0]

describe('gas client', () => {
  it('sends the secret in the body and follows the Apps Script redirect', async () => {
    process.env.GAS_URL = base() + '/exec'
    reply = { status: 'created', id: 'r1', code: 'K7QX' }
    await expect(gasRegister(payload)).resolves.toEqual(reply)
    expect(JSON.parse(lastBody)).toMatchObject({ secret: 'top-secret', action: 'register' })
  })

  it('throws on unauthorized', async () => {
    process.env.GAS_URL = base() + '/exec'
    reply = { status: 'unauthorized' }
    await expect(gasRegister(payload)).rejects.toThrow(/unauthorized/)
  })

  it('throws a clear error when the deployment returns HTML', async () => {
    process.env.GAS_URL = base() + '/html'
    await expect(gasRegister(payload)).rejects.toThrow(/non-JSON/)
  })
})
