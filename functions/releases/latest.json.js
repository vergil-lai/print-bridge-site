import { buildDownloadManifest } from '../../lib/download-manifest.mjs'

const sourceUrl = 'https://github.com/vergil-lai/print-bridge/releases/latest/download/latest.json'

export async function onRequest(context) {
  const method = context.request.method
  if (method !== 'GET' && method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } })
  }

  const cacheKey = new Request(new URL('/releases/latest.json', context.request.url))
  const cache = caches.default
  let response = await cache.match(cacheKey)

  if (!response) {
    try {
      const upstream = await fetch(sourceUrl, {
        headers: { 'cache-control': 'no-cache' },
        cf: { cacheTtl: 0 },
        signal: AbortSignal.timeout(10000)
      })
      if (!upstream.ok) throw new Error(`GitHub HTTP ${upstream.status}`)

      const manifest = buildDownloadManifest(await upstream.json())
      response = Response.json(manifest, {
        headers: { 'cache-control': 'public, max-age=0, s-maxage=300' }
      })
    } catch (error) {
      console.error('Could not fetch latest GitHub release:', error)
      return Response.json({ error: 'Unable to fetch the latest GitHub release' }, {
        status: 502,
        headers: { 'cache-control': 'no-store' }
      })
    }

    context.waitUntil(cache.put(cacheKey, response.clone()))
  }

  return method === 'HEAD' ? new Response(null, response) : response
}
