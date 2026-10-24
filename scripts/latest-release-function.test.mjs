import assert from 'node:assert/strict'
import test from 'node:test'

import { onRequest } from '../functions/releases/latest.json.js'

function setup(t) {
  let now = 0
  const entries = new Map()
  const pending = []
  const cache = {
    async match(request) {
      const entry = entries.get(request.url)
      return entry && entry.expires > now ? entry.response.clone() : undefined
    },
    async put(request, response) {
      const ttl = Number(response.headers.get('cache-control').match(/s-maxage=(\d+)/)[1])
      entries.set(request.url, { response, expires: now + ttl })
    }
  }
  const originalCaches = Object.getOwnPropertyDescriptor(globalThis, 'caches')
  Object.defineProperty(globalThis, 'caches', { configurable: true, value: { default: cache } })
  t.after(() => {
    if (originalCaches) Object.defineProperty(globalThis, 'caches', originalCaches)
    else delete globalThis.caches
  })
  const upstream = t.mock.method(globalThis, 'fetch', async () => Response.json({
    version: '0.2.7', pub_date: '2026-10-13T04:10:44Z'
  }))
  t.mock.method(console, 'error', () => {})

  return {
    upstream,
    advance(seconds) { now += seconds },
    async request(method = 'GET', query = '') {
      const response = await onRequest({
        request: new Request(`https://printbridge.pages.dev/releases/latest.json${query}`, { method }),
        waitUntil(promise) { pending.push(promise) }
      })
      await Promise.all(pending.splice(0))
      return response
    }
  }
}

test('fetches GitHub and returns all download formats with a five minute edge TTL', async (t) => {
  const env = setup(t)
  const response = await env.request()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'public, max-age=0, s-maxage=300')
  const manifest = await response.json()
  assert.equal(manifest.version, '0.2.7')
  assert.equal(Object.keys(manifest.platforms).length, 14)
  assert.match(manifest.platforms['darwin-aarch64-dmg'].url, /printbridge-v0\.2\.7\/PrintBridge_0\.2\.7_aarch64\.dmg$/)
  const [url, options] = env.upstream.mock.calls[0].arguments
  assert.equal(url, 'https://github.com/vergil-lai/print-bridge/releases/latest/download/latest.json')
  assert.equal(options.cache, undefined)
  assert.equal(options.headers['cache-control'], 'no-cache')
  assert.equal(options.cf.cacheTtl, 0)
  assert.ok(options.signal instanceof AbortSignal)
})

test('reuses cache across query strings and HEAD, then refreshes after five minutes', async (t) => {
  const env = setup(t)
  await env.request()
  env.advance(299)
  const cached = await env.request('GET', '?refresh=1')
  assert.equal((await cached.json()).version, '0.2.7')
  const head = await env.request('HEAD')
  assert.equal(await head.text(), '')
  assert.equal(head.headers.get('cache-control'), 'public, max-age=0, s-maxage=300')
  assert.equal(env.upstream.mock.callCount(), 1)

  env.advance(1)
  env.upstream.mock.mockImplementation(async () => Response.json({ version: '0.2.8' }))
  const refreshed = await env.request()
  assert.equal((await refreshed.json()).version, '0.2.8')
  assert.equal(env.upstream.mock.callCount(), 2)
})

test('HEAD on an empty cache populates a full GET response', async (t) => {
  const env = setup(t)
  const head = await env.request('HEAD')
  assert.equal(head.status, 200)
  assert.equal(await head.text(), '')
  assert.equal((await (await env.request()).json()).version, '0.2.7')
  assert.equal(env.upstream.mock.callCount(), 1)
})

for (const [name, fail] of [
  ['GitHub HTTP failure', async () => new Response('Unavailable', { status: 503 })],
  ['invalid JSON', async () => new Response('invalid')],
  ['invalid version', async () => Response.json({ version: 'latest' })],
  ['network timeout', async () => { throw new DOMException('Timed out', 'TimeoutError') }]
]) {
  test(`${name} returns an uncached error and retries on the next request`, async (t) => {
    const env = setup(t)
    env.upstream.mock.mockImplementationOnce(fail)
    const failed = await env.request()
    assert.equal(failed.status, 502)
    assert.equal(failed.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await failed.json(), { error: 'Unable to fetch the latest GitHub release' })
    assert.equal((await (await env.request()).json()).version, '0.2.7')
    assert.equal(env.upstream.mock.callCount(), 2)
  })
}

test('rejects methods other than GET and HEAD without contacting GitHub', async (t) => {
  const env = setup(t)
  const response = await env.request('POST')
  assert.equal(response.status, 405)
  assert.equal(response.headers.get('allow'), 'GET, HEAD')
  assert.equal(env.upstream.mock.callCount(), 0)
})
