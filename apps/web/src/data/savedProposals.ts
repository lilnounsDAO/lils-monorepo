import type { Action } from '@/types/proposal-editor'
import type { EditorDraftContentType } from '@/utils/editorDrafts'
import { getAddress, isAddress } from 'viem'

export const SAVED_PROPOSALS_URL =
  import.meta.env.VITE_SAVED_PROPOSALS_URL || 'https://cms.lilnouns.wtf/api/saved-proposals'

export type SavedProposalTarget = 'proposal' | 'block' | 'ask'
export type SavedActionStatus = 'pending' | 'added' | 'updated' | 'rejected'

export type SavedProposalAccess = 'edit' | 'comment'

export type SavedProposalCollaborator = {
  address: string
  ensName: string | null
  addedAt: number
  role?: SavedProposalAccess
}

export type SavedProposalReply = {
  id: string
  text: string
  address: string
  ensName: string | null
  createdAt: number
}

export type SavedProposalComment = {
  id: string
  text: string
  address: string
  ensName: string | null
  createdAt: number
  target: SavedProposalTarget
  blockIndex: number | null
  blockExcerpt: string
  actionIndex: number | null
  action: Action | null
  actionStatus: SavedActionStatus | null
  actionNote: string
  appliedActionIndex: number | null
  replies: SavedProposalReply[]
}

export type SavedProposal = {
  id: string
  title: string
  bodyMarkdown: string
  actions: Action[]
  contentType: EditorDraftContentType
  authorAddress: string
  authorEns: string | null
  updatedByAddress: string
  updatedByEns: string | null
  createdAt: number
  updatedAt: number
  collaborators: SavedProposalCollaborator[]
  comments: SavedProposalComment[]
}

export type SavedProposalSummary = Omit<SavedProposal, 'bodyMarkdown' | 'actions' | 'comments' | 'collaborators'> & {
  commentCount: number
  collaboratorCount: number
}

type SignableAction = 'create' | 'update' | 'comment' | 'delete' | 'read' | 'invite' | 'uninvite' | 'reply' | 'decide'

export function inviteKey(person: string) {
  const trimmed = person.trim()
  if (isAddress(trimmed)) return getAddress(trimmed)
  return trimmed.toLowerCase()
}

export function commentCanonical(input: {
  text: string
  target: SavedProposalTarget
  blockIndex: number | null
  blockExcerpt: string
  actionIndex: number | null
  action: Action | null
}) {
  return JSON.stringify({
    text: input.text,
    target: input.target,
    blockIndex: input.blockIndex,
    blockExcerpt: input.blockExcerpt,
    actionIndex: input.actionIndex,
    action: input.action,
  })
}

export function replyCanonical(commentId: string, text: string) {
  return JSON.stringify({ commentId, text })
}

export function decisionCanonical(input: {
  commentId: string
  decision: 'add' | 'update' | 'reject'
  action: Action | null
  note: string
}) {
  return JSON.stringify({
    commentId: input.commentId,
    decision: input.decision,
    action: input.action,
    note: input.note,
  })
}

const SESSION_KEY = 'lilnouns-saved-proposals-session'

type SavedProposalSession = {
  token: string
  expiresAt: number
  address: string
}

export function readSavedProposalSession(address?: string) {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as SavedProposalSession
    if (!session?.token || !session.expiresAt || session.expiresAt <= Date.now()) return null
    if (address && session.address.toLowerCase() !== address.toLowerCase()) return null
    return session.token
  } catch {
    return null
  }
}

export function storeSavedProposalSession(address: string, auth: { token?: string; expiresAt?: number }) {
  if (!auth.token || !auth.expiresAt) return
  const session: SavedProposalSession = { token: auth.token, expiresAt: auth.expiresAt, address }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSavedProposalSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

export function personLabel(ensName: string | null | undefined, address: string) {
  if (ensName) return ensName
  if (address.length < 10) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export async function sha256Hex(text: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function proposalCanonical(proposal: {
  title: string
  bodyMarkdown: string
  actions: Action[]
  contentType: EditorDraftContentType
}) {
  return JSON.stringify({
    title: proposal.title,
    bodyMarkdown: proposal.bodyMarkdown,
    actions: proposal.actions,
    contentType: proposal.contentType,
  })
}

export function signableMessage(action: SignableAction, id: string, digest: string, timestamp: number) {
  return [
    'Lil Nouns saved proposal',
    `Action: ${action}`,
    `Proposal: ${id}`,
    `Digest: ${digest}`,
    `Timestamp: ${timestamp}`,
  ].join('\n')
}

async function request<T>(path: string, init?: RequestInit, address?: string): Promise<T> {
  const token = readSavedProposalSession(address)
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 20000)
  let response: Response
  try {
    response = await fetch(`${SAVED_PROPOSALS_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Saving took too long. It is saved on this browser. Try again.')
    }
    throw error
  } finally {
    window.clearTimeout(timer)
  }
  const body = await response.json().catch(() => ({}))
  if (response.status === 401) clearSavedProposalSession()
  if (!response.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'Could not reach saved proposals.')
  }
  if (address && body && typeof body === 'object') {
    storeSavedProposalSession(address, body as { token?: string; expiresAt?: number })
  }
  return body as T
}

export function listSavedProposals(address: string) {
  return request<{ proposals: SavedProposalSummary[] }>('', undefined, address)
}

export function getSavedProposal(id: string, address: string) {
  return request<{ proposal: SavedProposal }>(`/${id}`, undefined, address)
}

export function openSavedProposalSession(payload: Record<string, unknown>) {
  return request<{ token: string; expiresAt: number }>('/session', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, typeof payload.address === 'string' ? payload.address : undefined)
}

export function createSavedProposal(payload: Record<string, unknown>) {
  return request<{ proposal: SavedProposal }>('', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, typeof payload.address === 'string' ? payload.address : undefined)
}

export function updateSavedProposal(id: string, payload: Record<string, unknown>) {
  return request<{ proposal: SavedProposal }>(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, typeof payload.address === 'string' ? payload.address : undefined)
}

export function deleteSavedProposal(id: string, payload: Record<string, unknown>) {
  return request<{ ok: boolean }>(`/${id}`, {
    method: 'DELETE',
    body: JSON.stringify(payload),
  }, typeof payload.address === 'string' ? payload.address : undefined)
}

export function addSavedProposalComment(id: string, payload: Record<string, unknown>) {
  return request<{ proposal: SavedProposal }>(`/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, typeof payload.address === 'string' ? payload.address : undefined)
}

export function addSavedProposalCollaborator(id: string, payload: Record<string, unknown>) {
  return request<{ proposal: SavedProposal }>(`/${id}/collaborators`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, typeof payload.address === 'string' ? payload.address : undefined)
}

export function removeSavedProposalCollaborator(id: string, payload: Record<string, unknown>) {
  return request<{ proposal: SavedProposal }>(`/${id}/collaborators`, {
    method: 'DELETE',
    body: JSON.stringify(payload),
  }, typeof payload.address === 'string' ? payload.address : undefined)
}

export function replyToSavedProposalComment(id: string, commentId: string, payload: Record<string, unknown>) {
  return request<{ proposal: SavedProposal }>(`/${id}/comments/${commentId}/replies`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, typeof payload.address === 'string' ? payload.address : undefined)
}

export function decideSavedProposalComment(id: string, commentId: string, payload: Record<string, unknown>) {
  return request<{ proposal: SavedProposal }>(`/${id}/comments/${commentId}/decision`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, typeof payload.address === 'string' ? payload.address : undefined)
}
