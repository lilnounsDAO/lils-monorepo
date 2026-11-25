import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { pwaPlugin } from '../vite-plugin-pwa.mjs'

const origin = 'https://lilnouns.example'
const offlineUrl = origin + '/offline.html'
const buildAssets = new Map()
pwaPlugin().generateBundle.call({
  emitFile: ({ fileName, source }) => buildAssets.set(fileName, source),
})

function bootWorker({ fetch, caches, claim } = {}) {
  const handlers = new Map()
  runInNewContext(buildAssets.get('sw.js'), {
    fetch,
    caches,
    Response,
    URL,
    self: {
      location: { origin },
      clients: { claim },
      addEventListener: (type, listener) => handlers.set(type, listener),
    },
  })

  return {
    lifecycle(type) {
      let result
      handlers.get(type)({ waitUntil: (promise) => { result = promise } })
      return result
    },
    navigate(path, init = {}) {
      let result
      handlers.get('fetch')({
        request: { url: new URL(path, origin).href, method: 'GET', mode: 'navigate', destination: 'document', ...init },
        respondWith: (promise) => { result = promise },
      })
      return result
    },
  }
}

test('manifest retains the install identity and references real icons in the declared sizes', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/manifest.json', import.meta.url)))
  assert.equal(manifest.id, '/')
  assert.equal(manifest.start_url, '/')
  assert.equal(manifest.scope, '/')
  assert.equal(manifest.display, 'standalone')
  for (const [size, purpose] of [[192, 'any'], [512, 'any'], [512, 'maskable']]) {
    const icon = manifest.icons.find((item) => item.sizes === `${size}x${size}` && (item.purpose ?? 'any') === purpose)
    assert.ok(icon)
    const png = readFileSync(new URL('../public' + icon.src, import.meta.url))
    assert.equal(png.readUInt32BE(16), size)
    assert.equal(png.readUInt32BE(20), size)
    if (purpose === 'maskable') assert.equal(png[25], 2, 'maskable icon has an opaque RGB background')
  }
  const appleIcon = readFileSync(new URL('../public/apple-icon.png', import.meta.url))
  assert.equal(appleIcon.readUInt32BE(16), 180)
  assert.equal(appleIcon.readUInt32BE(20), 180)
})

test('install stores only the versioned offline document, with no credentials', async () => {
  const offlinePage = buildAssets.get('offline.html')
  assert.match(offlinePage, /src="data:image\/png;base64,[A-Za-z0-9+/=]+"/)
  const worker = bootWorker({
    fetch: (url, options) => {
      assert.equal(url, offlineUrl)
      assert.equal(options.credentials, 'omit')
      assert.equal(options.cache, 'reload')
      assert.equal(options.redirect, 'error')
      return new Response(offlinePage, { headers: { 'Content-Type': 'text/html' } })
    },
    caches: {
      open(name) {
        assert.match(name, /^lil-nouns-pwa-[a-f0-9]{64}$/)
        return {
          async put(url, response) {
            assert.equal(url, offlineUrl)
            assert.equal(await response.text(), offlinePage)
          },
        }
      },
    },
  })
  await worker.lifecycle('install')
})

test('install fails when the host rewrites the offline document to the SPA', async () => {
  const worker = bootWorker({
    fetch: () => new Response('<div id="root"></div>', { headers: { 'Content-Type': 'text/html' } }),
  })
  await assert.rejects(worker.lifecycle('install'), /offline page is missing/)
})

test('activation removes only old Lil Nouns caches and claims clients after cleanup', async () => {
  const currentCache = buildAssets.get('sw.js').match(/CACHE_PREFIX \+ '([a-f0-9]{64})'/)[1]
  const events = []
  const worker = bootWorker({
    caches: {
      keys: async () => ['other-app', 'lil-nouns-pwa-old', 'lil-nouns-pwa-' + currentCache],
      delete: async (name) => events.push(name),
    },
    claim: async () => events.push('claim'),
  })
  await worker.lifecycle('activate')
  assert.deepEqual(events, ['lil-nouns-pwa-old', 'claim'])
})

test('home and deep links use a fresh network response or a self-contained fallback', async () => {
  let online = true
  const worker = bootWorker({
    fetch: async (request) => {
      if (!online) throw new TypeError('Network unavailable')
      return new Response(request.url, { status: 503 })
    },
    caches: { match: async (url, { cacheName }) => {
      assert.equal(url, offlineUrl)
      assert.match(cacheName, /^lil-nouns-pwa-[a-f0-9]{64}$/)
      return new Response(buildAssets.get('offline.html'))
    } },
  })
  const onlineResponse = await worker.navigate('/vote/123?foo=bar')
  assert.equal(onlineResponse.status, 503)
  assert.equal(await onlineResponse.text(), origin + '/vote/123?foo=bar')

  online = false
  for (const path of ['/', '/vote/123?foo=bar', '/Vote/123', '/profile/lilnouns.eth']) {
    const offlineResponse = await worker.navigate(path)
    assert.equal(offlineResponse.status, 503)
    assert.equal(offlineResponse.headers.get('cache-control'), 'no-store')
    assert.match(await offlineResponse.text(), /Connection unavailable/)
  }
})

test('the worker leaves APIs, assets, external redirects and writes to the browser', () => {
  const worker = bootWorker()
  for (const path of [
    '/api/rpc', '/api/discord/events', '/.netlify/functions/anything',
    '/.well-known/anything', '/discord', '/docs', '/assets/chunk.js',
    '/manifest.json', '/offline.html', origin + '//api/rpc', 'https://rpc.example/vote',
  ]) {
    assert.equal(worker.navigate(path), undefined, path)
  }
  assert.equal(worker.navigate('/vote/123', { method: 'POST' }), undefined)
  assert.equal(worker.navigate('/vote/123', { mode: 'cors', destination: '' }), undefined)
  assert.equal(worker.navigate('/vote/123', { destination: 'iframe' }), undefined)
})
