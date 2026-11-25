import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

export function pwaPlugin() {
  return {
    name: 'lil-nouns-pwa',
    apply: 'build',
    generateBundle() {
      const logo = readFileSync(new URL('./public/apple-icon.png', import.meta.url))
      const offlinePage = readFileSync(new URL('./pwa/offline.html', import.meta.url), 'utf8')
        .replace('__LIL_NOUNS_ICON__', logo.toString('base64'))
      const worker = readFileSync(new URL('./pwa/service-worker.js', import.meta.url), 'utf8')
      const revision = createHash('sha256').update(worker).update(offlinePage).digest('hex')

      this.emitFile({ type: 'asset', fileName: 'offline.html', source: offlinePage })
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: worker.replace('__LIL_NOUNS_CACHE_REVISION__', revision),
      })
    },
  }
}
