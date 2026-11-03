import type { Action } from '@/types/proposal-editor'
import { personLabel, type SavedProposalComment } from '@/data/savedProposals'

export function actionLabel(action: Action) {
  switch (action.type) {
    case 'one-time-payment':
      return `Transfer ${action.amount} ${action.currency.toUpperCase()}`
    case 'streaming-payment':
      return `Stream ${action.amount} ${action.currency.toUpperCase()}`
    case 'custom-transaction':
      return `Call ${action.contractCallSignature}`
    case 'treasury-noun-transfer':
      return `Transfer Noun #${action.nounId}`
    case 'payer-top-up':
      return `Top up ${action.amount} ${action.currency.toUpperCase()}`
    default:
      return 'Action'
  }
}

const statusLabel: Record<string, string> = {
  pending: 'Requested',
  added: 'Added',
  updated: 'Updated',
  rejected: 'Rejected',
}

export function DraftComposer({
  label,
  text,
  onText,
  attached,
  onAttach,
  onClearAttached,
  onSubmit,
  busy,
}: {
  label: string
  text: string
  onText: (value: string) => void
  attached: Action | null
  onAttach: () => void
  onClearAttached: () => void
  onSubmit: () => void
  busy: boolean
}) {
  return (
    <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-2">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <textarea
        value={text}
        onChange={(event) => onText(event.target.value)}
        placeholder="Write a comment"
        rows={2}
        disabled={busy}
        className="w-full resize-none rounded border border-gray-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-gray-400"
      />
      {attached && (
        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-gray-600">
          <span className="truncate">Attached: {actionLabel(attached)}</span>
          <button type="button" className="text-gray-500 hover:text-gray-800" onClick={onClearAttached}>
            Remove
          </button>
        </div>
      )}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onAttach}
          disabled={busy}
          className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {attached ? 'Change action' : 'Attach an action'}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy || (!text.trim() && !attached)}
          className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {busy ? 'Posting…' : 'Comment'}
        </button>
      </div>
    </div>
  )
}

export function DraftThread({
  comments,
  isEditor,
  replyDrafts,
  onReplyDraft,
  onReply,
  onAdd,
  onReject,
  onUpdate,
  busyId,
}: {
  comments: SavedProposalComment[]
  isEditor: boolean
  replyDrafts: Record<string, string>
  onReplyDraft: (id: string, text: string) => void
  onReply: (comment: SavedProposalComment) => void
  onAdd: (comment: SavedProposalComment) => void
  onReject: (comment: SavedProposalComment) => void
  onUpdate: (comment: SavedProposalComment) => void
  busyId: string | null
}) {
  if (comments.length === 0) return null
  return (
    <ul className="mt-2 flex flex-col gap-2">
      {comments.map((comment) => {
        const busy = busyId === comment.id
        const status = comment.actionStatus
        return (
          <li key={comment.id} className="rounded-md border border-gray-100 bg-white px-2 py-2 text-sm">
            <p className="text-gray-800">
              <span className="font-medium text-gray-600">{personLabel(comment.ensName, comment.address)}</span>
              {comment.text ? ` ${comment.text}` : ''}
            </p>
            {comment.action && (
              <p className="mt-1 text-xs text-gray-600">
                Ask: {actionLabel(comment.action)}
                {status ? ` · ${statusLabel[status] || status}` : ''}
                {comment.actionNote ? ` · ${comment.actionNote}` : ''}
              </p>
            )}
            {comment.replies.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 border-l border-gray-200 pl-2">
                {comment.replies.map((reply) => (
                  <li key={reply.id} className="text-sm text-gray-800">
                    <span className="font-medium text-gray-600">{personLabel(reply.ensName, reply.address)}</span>
                    {` ${reply.text}`}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  value={replyDrafts[comment.id] || ''}
                  onChange={(event) => onReplyDraft(comment.id, event.target.value)}
                  placeholder={isEditor ? 'Reply' : 'Reply'}
                  disabled={busy}
                  className="min-w-0 flex-1 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-gray-400"
                />
                <button
                  type="button"
                  disabled={busy || !(replyDrafts[comment.id] || '').trim()}
                  onClick={() => onReply(comment)}
                  className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Reply
                </button>
              </div>
              {isEditor && comment.action && status !== 'rejected' && (
                <div className="flex flex-wrap gap-2">
                  {comment.appliedActionIndex === null && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onAdd(comment)}
                      className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Add action
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onUpdate(comment)}
                    className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Update action
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onReject(comment)}
                    className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
