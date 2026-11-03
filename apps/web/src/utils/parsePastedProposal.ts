import type { Descendant } from 'slate'
import { parseActionsFromJSON } from '@/utils/action-json-parser'
import { transactionsToActions, type Transaction } from '@/utils/transactions'
import type { Action } from '@/types/proposal-editor'

export interface PastedProposal {
  title?: string
  body?: Descendant[]
  actions?: Action[]
}

export function markdownToDescendants(markdown: string): Descendant[] {
  const blocks = markdown
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  if (blocks.length === 0) {
    return [{ type: 'paragraph', children: [{ text: '' }] } as Descendant]
  }

  return blocks.map((block) => {
    const image = block.match(/^!\[([^\]]*)\]\((data:image\/png;base64,[A-Za-z0-9+/=]+|https?:\/\/[^)\s]+)\)$/)
    if (image) {
      return {
        type: 'image',
        url: image[2],
        caption: image[1],
        children: [{ text: '' }],
      } as Descendant
    }
    if (block.startsWith('### ')) {
      return { type: 'heading-three', children: [{ text: block.slice(4).trim() }] } as Descendant
    }
    if (block.startsWith('## ')) {
      return { type: 'heading-two', children: [{ text: block.slice(3).trim() }] } as Descendant
    }
    if (block.startsWith('# ')) {
      return { type: 'heading-one', children: [{ text: block.slice(2).trim() }] } as Descendant
    }
    return { type: 'paragraph', children: [{ text: block }] } as Descendant
  })
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value
  return undefined
}

function actionsFromGovernorShape(item: Record<string, unknown>): Action[] | undefined {
  const targets = item.targets
  const signatures = item.signatures
  const calldatas = item.calldatas ?? item.calldata
  if (!Array.isArray(targets) || !Array.isArray(signatures)) return undefined

  const values = Array.isArray(item.values) ? item.values : []
  const datas = Array.isArray(calldatas) ? calldatas : []
  const transactions: Transaction[] = targets.map((target, index) => ({
    target: String(target),
    value: String(values[index] ?? '0'),
    signature: String(signatures[index] ?? ''),
    calldata: String(datas[index] ?? '0x'),
  }))
  const actions = transactionsToActions(transactions, 1)
  return actions.length > 0 ? actions : undefined
}

export function parsePastedProposal(text: string): { success: true; proposal: PastedProposal } | { success: false; errors: string[] } {
  const trimmed = text.trim()
  if (!trimmed) {
    return { success: false, errors: ['Clipboard is empty.'] }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    if (trimmed.startsWith('#')) {
      const [first, ...rest] = trimmed.split(/\n+/)
      const title = first.replace(/^#\s*/, '').trim()
      const body = rest.join('\n\n').trim()
      if (!title) return { success: false, errors: ['Clipboard markdown has no title.'] }
      return {
        success: true,
        proposal: {
          title,
          body: markdownToDescendants(body || title),
        },
      }
    }
    return { success: false, errors: ['Clipboard is not proposal JSON or a markdown title.'] }
  }

  if (Array.isArray(parsed)) {
    const result = parseActionsFromJSON(trimmed)
    if (!result.success || !result.actions) {
      return { success: false, errors: result.errors || ['Could not read actions from the clipboard.'] }
    }
    return { success: true, proposal: { actions: result.actions } }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { success: false, errors: ['Clipboard JSON must be a proposal object or an actions array.'] }
  }

  const item = parsed as Record<string, unknown>
  const title = asString(item.title)
  const description = asString(item.body) ?? asString(item.description)
  let actions: Action[] | undefined

  if (item.actions != null) {
    const result = parseActionsFromJSON(JSON.stringify(item.actions))
    if (!result.success || !result.actions) {
      return { success: false, errors: result.errors || ['Could not read proposal actions.'] }
    }
    actions = result.actions
  } else {
    actions = actionsFromGovernorShape(item)
  }

  if (!title && !description && !actions) {
    return { success: false, errors: ['Clipboard JSON has no title, description, or actions.'] }
  }

  return {
    success: true,
    proposal: {
      title,
      body: description ? markdownToDescendants(description) : undefined,
      actions,
    },
  }
}
