import type { Action } from '@/types/proposal-editor'

export type EditorDraftContentType = 'proposal' | 'candidate' | 'topic'

export type EditorDraft = {
  id: string
  title: string
  bodyMarkdown: string
  actions: Action[]
  contentType: EditorDraftContentType
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'lilnouns-editor-drafts'
const SCHEMA = 1

type DraftStore = {
  schema: number
  drafts: EditorDraft[]
}

function isEditorDraft(value: unknown): value is EditorDraft {
  if (!value || typeof value !== 'object') return false
  const draft = value as Partial<EditorDraft>
  return typeof draft.id === 'string'
    && typeof draft.title === 'string'
    && typeof draft.bodyMarkdown === 'string'
    && Array.isArray(draft.actions)
    && (draft.contentType === 'proposal' || draft.contentType === 'candidate' || draft.contentType === 'topic')
    && typeof draft.createdAt === 'number'
    && typeof draft.updatedAt === 'number'
}

function readStore(): EditorDraft[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as DraftStore
    if (!parsed || parsed.schema !== SCHEMA || !Array.isArray(parsed.drafts)) return []
    return parsed.drafts.filter(isEditorDraft).sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

function writeStore(drafts: EditorDraft[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ schema: SCHEMA, drafts }))
}

export function loadEditorDrafts(): EditorDraft[] {
  return readStore()
}

export function upsertEditorDraft(draft: EditorDraft): EditorDraft[] {
  const drafts = readStore()
  const exists = drafts.some((item) => item.id === draft.id)
  const next = exists
    ? drafts.map((item) => (item.id === draft.id ? draft : item))
    : [draft, ...drafts]
  writeStore(next)
  return next.sort((a, b) => b.updatedAt - a.updatedAt)
}

export function removeEditorDraft(id: string): EditorDraft[] {
  const next = readStore().filter((item) => item.id !== id)
  writeStore(next)
  return next
}

export function newEditorDraftId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `draft-${Date.now()}`
}

export function formatEditorDraftTime(timestamp: number): string {
  const minutes = Math.round((Date.now() - timestamp) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 14) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}
