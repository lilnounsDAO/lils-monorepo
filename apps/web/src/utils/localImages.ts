// Images dropped or pasted into the proposal editor stay in this browser (IndexedDB)
// until the proposal is submitted or shared. The markdown refers to them as
// `local-image:<sha256>` and uploadLocalImages swaps those for IPFS gateway links.

export const LOCAL_IMAGE_SCHEME = 'local-image:'
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IPFS_UPLOAD_URL = import.meta.env.VITE_IPFS_UPLOAD_URL || '/api/ipfs/upload'

/** The wallet that signs for the upload. The server ties each image to it. */
export type ImageUploadSigner = {
  address: string
  chainId: number
  signMessage: (message: string) => Promise<string>
}

const DB_NAME = 'lilnouns-editor-images'
const STORE = 'images'
const LOCAL_IMAGE_PATTERN = /local-image:([0-9a-f]{64})/g
const DATA_IMAGE_PATTERN = /\]\((data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+)\)/g

type StoredImage = {
  hash: string
  blob: Blob
  name: string
  url?: string
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: 'hash' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      dbPromise = null
      reject(request.error)
    }
  })
  return dbPromise
}

async function readImage(hash: string): Promise<StoredImage | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(hash)
    request.onsuccess = () => resolve(request.result as StoredImage | undefined)
    request.onerror = () => reject(request.error)
  })
}

async function writeImage(image: StoredImage): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(image)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function hashBlob(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function isImageFile(file: File) {
  return /^image\/(png|jpeg|gif|webp)$/.test(file.type)
}

/** Keeps the image in this browser and returns its local-image: url. */
export async function storeLocalImageUrl(file: File): Promise<string> {
  if (!isImageFile(file)) throw new Error('Use a PNG, JPEG, GIF, or WebP image.')
  if (file.size > MAX_IMAGE_BYTES) throw new Error(`${file.name || 'This image'} is over 5 MB.`)
  const hash = await hashBlob(file)
  const existing = await readImage(hash)
  if (!existing) await writeImage({ hash, blob: file, name: file.name })
  return `${LOCAL_IMAGE_SCHEME}${hash}`
}

export function imageAltFromName(name: string) {
  return name.replace(/\.[a-z0-9]+$/i, '').replace(/[[\]]/g, '')
}

/** Keeps the image in this browser and returns markdown that points at it. */
export async function storeLocalImage(file: File): Promise<string> {
  return `![${imageAltFromName(file.name || '')}](${await storeLocalImageUrl(file)})`
}

const objectUrls = new Map<string, Promise<string | undefined>>()

/** Returns something an <img> can show for a local-image: url, or the url itself. */
export function resolveImageSrc(src: string): Promise<string | undefined> {
  if (!src.startsWith(LOCAL_IMAGE_SCHEME)) return Promise.resolve(src)
  const hash = src.slice(LOCAL_IMAGE_SCHEME.length)
  let pending = objectUrls.get(hash)
  if (!pending) {
    pending = readImage(hash)
      .then((image) => (image ? image.url || URL.createObjectURL(image.blob) : undefined))
      .catch(() => undefined)
    objectUrls.set(hash, pending)
  }
  return pending
}

export function hasLocalImages(markdown: string) {
  return markdown.includes(LOCAL_IMAGE_SCHEME) || /\]\(data:image\//.test(markdown)
}

// Must match MESSAGE_PATTERN in services/ipfs-upload/src/index.mjs.
function uploadMessage(address: string, chainId: number, hashes: string[]) {
  return [
    'Upload images to IPFS for a Lil Nouns proposal',
    '',
    `Wallet: ${address}`,
    `Chain: ${chainId}`,
    `Issued: ${new Date().toISOString()}`,
    'Images:',
    ...hashes,
  ].join('\n')
}

async function uploadBlob(blob: Blob, name: string, message: string, signature: string): Promise<string> {
  const body = new FormData()
  body.append('file', blob, name || 'image')
  body.append('message', message)
  body.append('signature', signature)
  const response = await fetch(IPFS_UPLOAD_URL, { method: 'POST', body })
  const result = await response.json().catch(() => null) as { url?: string, error?: string } | null
  if (!response.ok || !result?.url) {
    throw new Error(result?.error || `Image upload failed (${response.status}).`)
  }
  return result.url
}

type PendingImage = { hash: string, blob: Blob, name: string }

const MAX_IMAGES_PER_SIGNATURE = 20

/** Uploads images that have no IPFS link yet, one wallet signature per batch. */
async function uploadPending(images: PendingImage[], signer: ImageUploadSigner): Promise<Map<string, string>> {
  const urls = new Map<string, string>()
  for (let i = 0; i < images.length; i += MAX_IMAGES_PER_SIGNATURE) {
    const batch = images.slice(i, i + MAX_IMAGES_PER_SIGNATURE)
    const message = uploadMessage(signer.address, signer.chainId, batch.map((image) => image.hash))
    const signature = await signer.signMessage(message)
    await Promise.all(batch.map(async (image) => {
      const url = await uploadBlob(image.blob, image.name, message, signature)
      urls.set(image.hash, url)
      await writeImage({ hash: image.hash, blob: image.blob, name: image.name, url }).catch(() => {})
    }))
  }
  return urls
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const type = header.slice(5, header.indexOf(';'))
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
  return new Blob([bytes], { type })
}

/**
 * Uploads every image that only lives in this browser (local-image: refs and inline
 * data: images) to IPFS and returns the markdown with gateway links in their place.
 * Images uploaded before (same sha256) reuse their stored link and are not sent again.
 */
export async function uploadLocalImages(markdown: string, signer: ImageUploadSigner | null): Promise<string> {
  if (!hasLocalImages(markdown)) return markdown

  // ref in the markdown -> sha256
  const refs = new Map<string, string>()
  const pending = new Map<string, PendingImage>()

  for (const [ref, hash] of markdown.matchAll(LOCAL_IMAGE_PATTERN)) refs.set(ref, hash)
  const inline = new Map<string, Blob>()
  for (const [, dataUrl] of markdown.matchAll(DATA_IMAGE_PATTERN)) inline.set(dataUrl, dataUrlToBlob(dataUrl))
  await Promise.all(Array.from(inline, async ([dataUrl, blob]) => {
    refs.set(dataUrl, await hashBlob(blob))
  }))

  const links = new Map<string, string>()
  await Promise.all(Array.from(new Set(refs.values()), async (hash) => {
    const stored = await readImage(hash).catch(() => undefined)
    if (stored?.url) {
      links.set(hash, stored.url)
      return
    }
    const dataUrl = Array.from(refs).find(([ref, value]) => value === hash && inline.has(ref))?.[0]
    const blob = stored?.blob ?? (dataUrl ? inline.get(dataUrl) : undefined)
    if (!blob) throw new Error('An image in this draft is no longer on this browser. Add it again.')
    pending.set(hash, { hash, blob, name: stored?.name ?? '' })
  }))

  if (pending.size > 0) {
    if (!signer) throw new Error('Connect a wallet to upload the images in this draft.')
    const key = Array.from(pending.keys()).sort().join(',')
    let upload = inFlight.get(key)
    if (!upload) {
      upload = uploadPending(Array.from(pending.values()), signer).finally(() => inFlight.delete(key))
      inFlight.set(key, upload)
    }
    for (const [hash, url] of await upload) links.set(hash, url)
  }

  let next = markdown
  for (const [ref, hash] of refs) {
    const url = links.get(hash)
    if (url) next = next.split(ref).join(url)
  }
  return next
}

const inFlight = new Map<string, Promise<Map<string, string>>>()
