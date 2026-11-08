import React, { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Descendant } from 'slate'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { messageUtils } from '@/utils/message-utils'
import { markdownToDescendants } from '@/utils/parsePastedProposal'
import { isImageFile, storeLocalImage } from '@/utils/localImages'
import { ToastContext, ToastType } from '@/providers/toast'
import type { RichTextNode } from './RichTextEditor'

const emptyParagraph = (): Descendant => ({ type: 'paragraph', children: [{ text: '' }] })

export type MarkdownBlockFormat =
  | 'paragraph'
  | 'heading-one'
  | 'heading-two'
  | 'heading-three'
  | 'code-block'
  | 'block-quote'

export type MarkdownBlockEditorHandle = {
  applyBlock: (format: MarkdownBlockFormat) => void
  wrapSelection: (before: string, after: string) => void
  toggleInline: (format: 'bold' | 'italic' | 'link') => void
  insertMarkdown: (markdown: string) => void
}

interface MarkdownBlockEditorProps {
  value: Descendant[]
  onChange: (value: Descendant[]) => void
  placeholder?: string
  readOnly?: boolean
  onEditingChange?: (editing: boolean) => void
  onActiveFormats?: (formats: ActiveFormats) => void
  renderBlockFooter?: (index: number) => React.ReactNode
}

function blockMarkdown(block: Descendant): string {
  return messageUtils.descendantsToMarkdown([block as RichTextNode])
}

function stripBlockPrefix(markdown: string): string {
  let text = markdown
  if (text.startsWith('```\n') && text.endsWith('\n```')) {
    text = text.slice(4, -4)
  }
  const lines = text.split('\n').map((line) => {
    if (line.startsWith('### ')) return line.slice(4)
    if (line.startsWith('## ')) return line.slice(3)
    if (line.startsWith('# ')) return line.slice(2)
    if (line.startsWith('> ')) return line.slice(2)
    return line
  })
  return lines.join('\n')
}

function withBlockPrefix(markdown: string, format: MarkdownBlockFormat): string {
  const text = stripBlockPrefix(markdown)
  switch (format) {
    case 'heading-one':
      return `# ${text}`
    case 'heading-two':
      return `## ${text}`
    case 'heading-three':
      return `### ${text}`
    case 'block-quote':
      return text.split('\n').map((line) => `> ${line}`).join('\n')
    case 'code-block':
      return `\`\`\`\n${text}\n\`\`\``
    default:
      return text
  }
}

function blockFormat(markdown: string): MarkdownBlockFormat {
  if (markdown.startsWith('```\n') && markdown.endsWith('\n```')) return 'code-block'
  const lines = markdown.split('\n')
  if (lines.length > 0 && lines.every((line) => line.startsWith('> '))) return 'block-quote'
  const first = lines[0] ?? ''
  if (first.startsWith('### ')) return 'heading-three'
  if (first.startsWith('## ')) return 'heading-two'
  if (first.startsWith('# ')) return 'heading-one'
  return 'paragraph'
}

type InlineFormat = 'bold' | 'italic' | 'link'

type InlineSpan = {
  kind: InlineFormat
  start: number
  end: number
  innerStart: number
  innerEnd: number
  open: string
  close: string
}

export type ActiveFormats = {
  bold: boolean
  italic: boolean
  link: boolean
  headingOne: boolean
  headingTwo: boolean
}

export const emptyActiveFormats: ActiveFormats = {
  bold: false,
  italic: false,
  link: false,
  headingOne: false,
  headingTwo: false,
}

function findInlineSpans(markdown: string, from = 0, to = markdown.length): InlineSpan[] {
  const spans: InlineSpan[] = []
  let i = from
  while (i < to) {
    if (markdown[i] === '`') {
      const close = markdown.indexOf('`', i + 1)
      if (close !== -1 && close < to) {
        i = close + 1
        continue
      }
    }
    if (markdown.startsWith('![', i)) {
      const close = markdown.indexOf(')', i + 2)
      if (close !== -1 && close < to) {
        i = close + 1
        continue
      }
    }
    if (markdown.startsWith('**', i)) {
      const close = markdown.indexOf('**', i + 2)
      if (close !== -1 && close < to) {
        const span: InlineSpan = {
          kind: 'bold',
          start: i,
          end: close + 2,
          innerStart: i + 2,
          innerEnd: close,
          open: '**',
          close: '**',
        }
        spans.push(span, ...findInlineSpans(markdown, span.innerStart, span.innerEnd))
        i = span.end
        continue
      }
    }
    if (markdown[i] === '*' && markdown[i + 1] !== '*') {
      let close = -1
      for (let j = i + 1; j < to; j++) {
        if (markdown[j] === '*' && markdown[j + 1] !== '*') {
          close = j
          break
        }
      }
      if (close !== -1) {
        const span: InlineSpan = {
          kind: 'italic',
          start: i,
          end: close + 1,
          innerStart: i + 1,
          innerEnd: close,
          open: '*',
          close: '*',
        }
        spans.push(span, ...findInlineSpans(markdown, span.innerStart, span.innerEnd))
        i = span.end
        continue
      }
    }
    if (markdown[i] === '[') {
      const closeBracket = markdown.indexOf(']', i + 1)
      if (closeBracket !== -1 && closeBracket < to && markdown[closeBracket + 1] === '(') {
        const closeParen = markdown.indexOf(')', closeBracket + 2)
        if (closeParen !== -1 && closeParen < to) {
          const span: InlineSpan = {
            kind: 'link',
            start: i,
            end: closeParen + 1,
            innerStart: i + 1,
            innerEnd: closeBracket,
            open: '[',
            close: markdown.slice(closeBracket, closeParen + 1),
          }
          spans.push(span, ...findInlineSpans(markdown, span.innerStart, span.innerEnd))
          i = span.end
          continue
        }
      }
    }
    i += 1
  }
  return spans
}

function spanMatches(span: InlineSpan, start: number, end: number) {
  if (start === end) return start >= span.innerStart && start <= span.innerEnd
  const overlapsInner = start < span.innerEnd && end > span.innerStart
  const encloses = start <= span.start && end >= span.end
  return overlapsInner || encloses
}

function activeSpan(markdown: string, start: number, end: number, kind: InlineFormat) {
  const hits = findInlineSpans(markdown).filter((span) => span.kind === kind && spanMatches(span, start, end))
  hits.sort((a, b) => (a.end - a.start) - (b.end - b.start))
  return hits[0]
}

export function computeActiveFormats(markdown: string, start: number, end: number): ActiveFormats {
  const heading = blockFormat(markdown)
  return {
    bold: Boolean(activeSpan(markdown, start, end, 'bold')),
    italic: Boolean(activeSpan(markdown, start, end, 'italic')),
    link: Boolean(activeSpan(markdown, start, end, 'link')),
    headingOne: heading === 'heading-one',
    headingTwo: heading === 'heading-two',
  }
}

function applyInlineToggle(markdown: string, start: number, end: number, format: InlineFormat) {
  const span = activeSpan(markdown, start, end, format)
  if (span) {
    const inner = markdown.slice(span.innerStart, span.innerEnd)
    if (format === 'link' || start === end) {
      const next = markdown.slice(0, span.start) + inner + markdown.slice(span.end)
      return { markdown: next, selectionStart: span.start, selectionEnd: span.start + inner.length }
    }
    const relStart = Math.max(0, Math.min(inner.length, start - span.innerStart))
    const relEnd = Math.max(relStart, Math.min(inner.length, end - span.innerStart))
    const left = inner.slice(0, relStart)
    const mid = inner.slice(relStart, relEnd)
    const right = inner.slice(relEnd)
    const parts = `${left ? span.open + left + span.close : ''}${mid}${right ? span.open + right + span.close : ''}`
    const next = markdown.slice(0, span.start) + parts + markdown.slice(span.end)
    const selectionStart = span.start + (left ? span.open.length + left.length + span.close.length : 0)
    return { markdown: next, selectionStart, selectionEnd: selectionStart + mid.length }
  }
  if (format === 'link') return { markdown, selectionStart: start, selectionEnd: end }
  const marker = format === 'bold' ? '**' : '*'
  const selected = markdown.slice(start, end) || 'text'
  const next = markdown.slice(0, start) + marker + selected + marker + markdown.slice(end)
  const selectionStart = start + marker.length
  return { markdown: next, selectionStart, selectionEnd: selectionStart + selected.length }
}

type BlockSelection = { anchor: number, focus: number }
type DragState = { active: boolean, anchor: number, focus: number, moved: boolean }

const BLOCK_DRAG_TYPE = 'application/x-lilnouns-block'

function selectionBounds(selection: BlockSelection) {
  return {
    start: Math.min(selection.anchor, selection.focus),
    end: Math.max(selection.anchor, selection.focus),
  }
}

const MarkdownBlockEditor = forwardRef<MarkdownBlockEditorHandle, MarkdownBlockEditorProps>(
  function MarkdownBlockEditor({ value, onChange, placeholder, readOnly = false, onEditingChange, onActiveFormats, renderBlockFooter }, ref) {
    const blocks = value.length > 0 ? value : [emptyParagraph()]
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [draft, setDraft] = useState('')
    const [selection, setSelection] = useState<BlockSelection | null>(null)
    const [textRange, setTextRange] = useState<{ start: number, end: number } | null>(null)
    const draftRef = useRef('')
    const editingRef = useRef<number | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const valueRef = useRef(blocks)
    const lastEmitted = useRef<Descendant[] | null>(null)
    const selectionRef = useRef<BlockSelection | null>(null)
    const dragRef = useRef<DragState | null>(null)
    const textGestureRef = useRef<{ active: boolean, index: number, x: number, y: number } | null>(null)
    const caretRef = useRef<number | null>(null)
    const pendingSelectionRef = useRef<{ start: number, end: number } | null>(null)
    const restoringSelectionRef = useRef(false)
    const onActiveFormatsRef = useRef(onActiveFormats)
    onActiveFormatsRef.current = onActiveFormats
    const suppressBlurRef = useRef(false)
    const beginEditRef = useRef<(index: number) => void>(() => {})
    const blockDragSourceRef = useRef<{ start: number, end: number } | null>(null)
    const [dropIndex, setDropIndex] = useState<number | null>(null)
    const { addToast } = useContext(ToastContext)
    valueRef.current = blocks
    selectionRef.current = selection

    const emit = (next: Descendant[]) => {
      lastEmitted.current = next
      onChange(next)
    }
    const emitRef = useRef(emit)
    emitRef.current = emit

    useEffect(() => {
      if (value === lastEmitted.current) return
      editingRef.current = null
      setEditingIndex(null)
      selectionRef.current = null
      setSelection(null)
    }, [value])

    useEffect(() => {
      onEditingChange?.(editingIndex !== null)
    }, [editingIndex, onEditingChange])

    useEffect(() => {
      const textarea = textareaRef.current
      if (!textarea) return
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
      const pending = pendingSelectionRef.current
      if (pending) {
        const start = Math.max(0, Math.min(pending.start, textarea.value.length))
        const end = Math.max(start, Math.min(pending.end, textarea.value.length))
        restoringSelectionRef.current = true
        if (document.activeElement !== textarea) textarea.focus()
        textarea.setSelectionRange(start, end)
        pendingSelectionRef.current = null
        setTextRange((current) => (current && current.start === start && current.end === end ? current : { start, end }))
        requestAnimationFrame(() => {
          restoringSelectionRef.current = false
        })
        return
      }
      if (caretRef.current === null) return
      const pos = Math.max(0, Math.min(caretRef.current, textarea.value.length))
      textarea.focus()
      textarea.setSelectionRange(pos, pos)
      caretRef.current = null
    }, [draft, editingIndex])

    useEffect(() => {
      if (editingIndex === null) {
        onActiveFormatsRef.current?.(emptyActiveFormats)
        return
      }
      const start = textRange?.start ?? 0
      const end = textRange?.end ?? 0
      onActiveFormatsRef.current?.(computeActiveFormats(draft, start, end))
    }, [draft, editingIndex, textRange])

    const rememberTextRange = (start: number, end: number) => {
      if (restoringSelectionRef.current) return
      setTextRange((current) => (current && current.start === start && current.end === end ? current : { start, end }))
      if (editingRef.current !== null) {
        onActiveFormatsRef.current?.(computeActiveFormats(draftRef.current, start, end))
      }
    }

    const toggleInline = (format: InlineFormat) => {
      const textarea = textareaRef.current
      if (!textarea || editingRef.current === null) {
        if (format === 'link') return
        const marker = format === 'bold' ? '**' : '*'
        const index = valueRef.current.length
        const markdown = `${marker}text${marker}`
        draftRef.current = markdown
        pendingSelectionRef.current = { start: marker.length, end: marker.length + 4 }
        setDraft(markdown)
        const next = [...valueRef.current, ...markdownToDescendants(markdown)]
        editingRef.current = index
        setEditingIndex(index)
        emit(next)
        return
      }
      const result = applyInlineToggle(draftRef.current, textarea.selectionStart, textarea.selectionEnd, format)
      if (result.markdown === draftRef.current) return
      draftRef.current = result.markdown
      pendingSelectionRef.current = { start: result.selectionStart, end: result.selectionEnd }
      setTextRange({ start: result.selectionStart, end: result.selectionEnd })
      onActiveFormatsRef.current?.(computeActiveFormats(result.markdown, result.selectionStart, result.selectionEnd))
      setDraft(result.markdown)
    }

    const rememberSelection = (next: BlockSelection | null) => {
      selectionRef.current = next
      setSelection(next)
    }

    const commitIndex = (index: number, markdown: string) => {
      const current = valueRef.current
      if (index < 0 || index >= current.length) return current
      const parsed = markdownToDescendants(markdown)
      const next = [...current]
      next.splice(index, 1, ...parsed)
      return next.length > 0 ? next : [emptyParagraph()]
    }

    const stopEditing = (index: number, markdown: string) => {
      const next = commitIndex(index, markdown)
      editingRef.current = null
      setEditingIndex(null)
      emit(next)
    }

    const beginEdit = (index: number) => {
      if (readOnly || editingRef.current === index) return
      let current = valueRef.current
      let target = index
      if (editingRef.current !== null) {
        const previous = editingRef.current
        const before = current.length
        current = commitIndex(previous, draftRef.current)
        const added = current.length - before
        if (index > previous) target = index + added
        valueRef.current = current
        emit(current)
      }
      if (target < 0 || target >= current.length) return
      const markdown = blockMarkdown(current[target] ?? emptyParagraph()).trim()
      draftRef.current = markdown
      setDraft(markdown)
      editingRef.current = target
      setEditingIndex(target)
      rememberSelection(null)
    }
    beginEditRef.current = beginEdit

    const blocksAfterCommit = (start: number, end: number) => {
      let lo = Math.min(start, end)
      let hi = Math.max(start, end)
      let current = valueRef.current
      if (editingRef.current !== null) {
        const editing = editingRef.current
        if (editing < lo || editing > hi) {
          const before = current.length
          current = commitIndex(editing, draftRef.current)
          const added = current.length - before
          if (editing < lo) {
            lo += added
            hi += added
          }
        }
        editingRef.current = null
      }
      return { current, lo, hi }
    }

    const deleteSelection = (start: number, end: number) => {
      suppressBlurRef.current = true
      const { current, lo, hi } = blocksAfterCommit(start, end)
      const next = current.filter((_, index) => index < lo || index > hi)
      const result = next.length > 0 ? next : [emptyParagraph()]
      const focus = Math.min(lo, result.length - 1)
      const markdown = blockMarkdown(result[focus] ?? emptyParagraph()).trim()
      const caret = lo < result.length ? 0 : markdown.length
      valueRef.current = result
      draftRef.current = markdown
      setDraft(markdown)
      editingRef.current = focus
      setEditingIndex(focus)
      caretRef.current = caret
      rememberSelection(null)
      emit(result)
      requestAnimationFrame(() => {
        suppressBlurRef.current = false
      })
    }

    const replaceSelectionWithText = (start: number, end: number, text: string) => {
      suppressBlurRef.current = true
      const { current, lo, hi } = blocksAfterCommit(start, end)
      const next = current.filter((_, index) => index < lo || index > hi)
      next.splice(Math.min(lo, next.length), 0, emptyParagraph())
      const focus = Math.min(lo, next.length - 1)
      valueRef.current = next
      draftRef.current = text
      setDraft(text)
      editingRef.current = focus
      setEditingIndex(focus)
      caretRef.current = text.length
      rememberSelection(null)
      emit(next)
      requestAnimationFrame(() => {
        suppressBlurRef.current = false
      })
    }

    const blockIndexAt = (x: number, y: number) => {
      const element = document.elementFromPoint(x, y)
      const block = element?.closest('[data-block-index]')
      const index = Number(block?.getAttribute('data-block-index'))
      return Number.isInteger(index) ? index : null
    }

    // Commits the block being edited and says how later indexes moved.
    const commitEditing = () => {
      const editing = editingRef.current
      const current = valueRef.current
      if (editing === null) {
        return { current, shift: (i: number) => i, shiftEnd: (i: number) => i }
      }
      const committed = commitIndex(editing, draftRef.current)
      const added = committed.length - current.length
      editingRef.current = null
      setEditingIndex(null)
      return {
        current: committed,
        shift: (i: number) => (i > editing ? i + added : i),
        shiftEnd: (i: number) => (i >= editing ? i + added : i),
      }
    }

    const insertionIndexAt = (clientY: number) => {
      const nodes = containerRef.current?.querySelectorAll<HTMLElement>(':scope > [data-block-index]')
      if (!nodes) return valueRef.current.length
      for (const node of Array.from(nodes)) {
        const rect = node.getBoundingClientRect()
        if (clientY < rect.top + rect.height / 2) return Number(node.dataset.blockIndex)
      }
      return nodes.length
    }

    const moveBlocks = (start: number, end: number, at: number) => {
      suppressBlurRef.current = true
      const original = valueRef.current
      const { current, shift, shiftEnd } = commitEditing()
      const lo = shift(start)
      const hi = shiftEnd(end)
      const to = shift(at)
      let next = current
      if (to < lo || to > hi + 1) {
        const moving = current.slice(lo, hi + 1)
        next = [...current.slice(0, lo), ...current.slice(hi + 1)]
        const target = to > hi ? to - moving.length : to
        next.splice(target, 0, ...moving)
        rememberSelection(moving.length > 1 ? { anchor: target, focus: target + moving.length - 1 } : null)
      }
      valueRef.current = next
      if (next !== original) emit(next)
      requestAnimationFrame(() => {
        suppressBlurRef.current = false
      })
    }

    const insertImages = async (files: File[], at: number) => {
      const images = files.filter(isImageFile)
      if (images.length < files.length) {
        addToast?.({ content: 'Only PNG, JPEG, GIF, and WebP images can be added.', type: ToastType.Failure })
      }
      if (images.length === 0) return
      let markdown: string[]
      try {
        markdown = await Promise.all(images.map(storeLocalImage))
      } catch (error) {
        addToast?.({
          content: error instanceof Error ? error.message : 'Could not add that image.',
          type: ToastType.Failure,
        })
        return
      }
      suppressBlurRef.current = true
      const { current, shift } = commitEditing()
      const parsed = markdown.flatMap((item) => markdownToDescendants(item))
      const blank = current.length === 1 && !blockMarkdown(current[0]).trim()
      const next = blank ? parsed : [...current]
      if (!blank) next.splice(Math.min(shift(at), current.length), 0, ...parsed)
      valueRef.current = next
      rememberSelection(null)
      emit(next)
      requestAnimationFrame(() => {
        suppressBlurRef.current = false
      })
    }

    const isBlockDrag = (event: React.DragEvent) => event.dataTransfer.types.includes(BLOCK_DRAG_TYPE)
    const isFileDrag = (event: React.DragEvent) => event.dataTransfer.types.includes('Files')

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      if (readOnly || (!isBlockDrag(event) && !isFileDrag(event))) return
      event.preventDefault()
      event.dataTransfer.dropEffect = isBlockDrag(event) ? 'move' : 'copy'
      const index = insertionIndexAt(event.clientY)
      setDropIndex((current) => (current === index ? current : index))
    }

    const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
      const next = event.relatedTarget
      if (next instanceof Node && event.currentTarget.contains(next)) return
      setDropIndex(null)
    }

    const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
      if (readOnly || (!isBlockDrag(event) && !isFileDrag(event))) return
      event.preventDefault()
      const at = insertionIndexAt(event.clientY)
      setDropIndex(null)
      const source = blockDragSourceRef.current
      blockDragSourceRef.current = null
      if (isBlockDrag(event)) {
        if (source) moveBlocks(source.start, source.end, at)
        return
      }
      void insertImages(Array.from(event.dataTransfer.files), at)
    }

    const onPasteImages = (event: React.ClipboardEvent, at: number) => {
      const files = Array.from(event.clipboardData.files)
      if (readOnly || files.length === 0 || !files.some(isImageFile)) return
      event.preventDefault()
      void insertImages(files, at)
    }

    useEffect(() => {
      const onMove = (event: PointerEvent) => {
        const drag = dragRef.current
        if (drag?.active) {
          const index = blockIndexAt(event.clientX, event.clientY)
          if (index === null || index === drag.focus) return
          if (index !== drag.anchor) drag.moved = true
          drag.focus = index
          if (drag.moved) rememberSelection({ anchor: drag.anchor, focus: index })
          return
        }

        const gesture = textGestureRef.current
        const textarea = textareaRef.current
        if (!gesture?.active || !textarea || editingRef.current === null) return
        const dx = event.clientX - gesture.x
        const dy = event.clientY - gesture.y
        if (dx * dx + dy * dy < 36) return
        const hit = document.elementFromPoint(event.clientX, event.clientY)
        if (hit === textarea) return
        const index = blockIndexAt(event.clientX, event.clientY)
        if (index === null || index === gesture.index) return
        const origin = gesture.index
        textGestureRef.current = null
        suppressBlurRef.current = true
        const before = valueRef.current.length
        const committed = commitIndex(origin, draftRef.current)
        const added = committed.length - before
        valueRef.current = committed
        editingRef.current = null
        setEditingIndex(null)
        emitRef.current(committed)
        const focus = index > origin ? index + added : index
        dragRef.current = { active: true, anchor: origin, focus, moved: true }
        rememberSelection({ anchor: origin, focus })
        containerRef.current?.focus({ preventScroll: true })
        requestAnimationFrame(() => {
          suppressBlurRef.current = false
        })
      }

      const onUp = () => {
        textGestureRef.current = null
        const drag = dragRef.current
        if (!drag?.active) return
        dragRef.current = null
        if (!drag.moved) {
          rememberSelection(null)
          beginEditRef.current(drag.anchor)
          return
        }
        rememberSelection({ anchor: drag.anchor, focus: drag.focus })
        containerRef.current?.focus({ preventScroll: true })
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      return () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
    }, [])

    const joinWith = (direction: 'previous' | 'next') => {
      const index = editingRef.current
      if (index === null) return
      const neighbor = direction === 'previous' ? index - 1 : index + 1
      if (neighbor < 0 || neighbor >= valueRef.current.length) return
      const textarea = textareaRef.current
      if (!textarea || textarea.selectionStart !== textarea.selectionEnd) return
      const atBoundary = direction === 'previous'
        ? textarea.selectionStart === 0
        : textarea.selectionStart === draftRef.current.length
      if (!atBoundary) return

      suppressBlurRef.current = true
      const currentMd = draftRef.current
      const neighborMd = blockMarkdown(valueRef.current[neighbor]).trim()
      if (!currentMd) {
        const next = valueRef.current.filter((_, blockIndex) => blockIndex !== index)
        const result = next.length > 0 ? next : [emptyParagraph()]
        const focus = Math.min(direction === 'previous' ? index - 1 : index, result.length - 1)
        const markdown = blockMarkdown(result[focus] ?? emptyParagraph()).trim()
        valueRef.current = result
        draftRef.current = markdown
        setDraft(markdown)
        editingRef.current = focus
        setEditingIndex(focus)
        caretRef.current = direction === 'previous' ? markdown.length : 0
        emit(result)
        requestAnimationFrame(() => {
          suppressBlurRef.current = false
        })
        return
      }
      if (!neighborMd) {
        const next = valueRef.current.filter((_, blockIndex) => blockIndex !== neighbor)
        const focus = direction === 'previous' ? index - 1 : index
        valueRef.current = next
        editingRef.current = focus
        setEditingIndex(focus)
        caretRef.current = direction === 'previous' ? 0 : currentMd.length
        emit(next)
        requestAnimationFrame(() => {
          suppressBlurRef.current = false
        })
        return
      }

      const combined = direction === 'previous' ? `${neighborMd}\n${currentMd}` : `${currentMd}\n${neighborMd}`
      const cursor = direction === 'previous' ? neighborMd.length : currentMd.length
      const next = valueRef.current.filter((_, blockIndex) => blockIndex !== neighbor)
      const focus = direction === 'previous' ? index - 1 : index
      valueRef.current = next
      draftRef.current = combined
      setDraft(combined)
      editingRef.current = focus
      setEditingIndex(focus)
      caretRef.current = cursor
      emit(next)
      requestAnimationFrame(() => {
        suppressBlurRef.current = false
      })
    }

    const moveCaret = (index: number, caret: number) => {
      if (index < 0 || index >= valueRef.current.length) return
      caretRef.current = caret
      beginEdit(index)
    }

    useImperativeHandle(ref, () => ({
      applyBlock: (format) => {
        const index = editingRef.current ?? 0
        const source = editingRef.current === index ? draftRef.current : blockMarkdown(valueRef.current[index] ?? emptyParagraph())
        const nextMarkdown = blockFormat(source) === format ? stripBlockPrefix(source) : withBlockPrefix(source, format)
        draftRef.current = nextMarkdown
        setDraft(nextMarkdown)
        editingRef.current = index
        setEditingIndex(index)
        const start = textareaRef.current?.selectionStart ?? 0
        const end = textareaRef.current?.selectionEnd ?? 0
        onActiveFormatsRef.current?.(computeActiveFormats(nextMarkdown, start, end))
      },
      toggleInline,
      wrapSelection: (before, after) => {
        const textarea = textareaRef.current
        if (!textarea || editingRef.current === null) {
          const index = valueRef.current.length
          const markdown = `${before}text${after}`
          draftRef.current = markdown
          setDraft(markdown)
          const next = [...valueRef.current, ...markdownToDescendants(markdown)]
          editingRef.current = index
          setEditingIndex(index)
          emit(next)
          return
        }
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selected = draftRef.current.slice(start, end) || 'text'
        const nextDraft = draftRef.current.slice(0, start) + before + selected + after + draftRef.current.slice(end)
        draftRef.current = nextDraft
        setDraft(nextDraft)
        requestAnimationFrame(() => {
          textarea.focus()
          const cursor = start + before.length + selected.length
          textarea.setSelectionRange(cursor, cursor)
        })
      },
      insertMarkdown: (markdown) => {
        const parsed = markdownToDescendants(markdown)
        if (editingRef.current !== null) {
          const index = editingRef.current
          const committed = commitIndex(index, draftRef.current)
          const insertAt = index + 1
          committed.splice(insertAt, 0, ...parsed)
          editingRef.current = null
          setEditingIndex(null)
          emit(committed)
          return
        }
        emit([...valueRef.current, ...parsed])
      },
    }))

    const onTextKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = event.currentTarget
      const index = editingRef.current
      if (index === null) return
      const collapsed = textarea.selectionStart === textarea.selectionEnd

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a' && textarea.selectionStart === 0 && textarea.selectionEnd === draftRef.current.length && blocks.length > 1) {
        event.preventDefault()
        suppressBlurRef.current = true
        const committed = commitIndex(index, draftRef.current)
        valueRef.current = committed
        editingRef.current = null
        setEditingIndex(null)
        emit(committed)
        rememberSelection({ anchor: 0, focus: Math.max(0, committed.length - 1) })
        containerRef.current?.focus({ preventScroll: true })
        requestAnimationFrame(() => {
          suppressBlurRef.current = false
        })
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        toggleInline('bold')
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'i') {
        event.preventDefault()
        toggleInline('italic')
        return
      }

      if (event.key === 'Backspace' && collapsed && textarea.selectionStart === 0) {
        event.preventDefault()
        joinWith('previous')
        return
      }
      if (event.key === 'Delete' && collapsed && textarea.selectionStart === draftRef.current.length) {
        event.preventDefault()
        joinWith('next')
        return
      }

      if (!collapsed || event.metaKey || event.ctrlKey || event.altKey) return

      if (event.key === 'ArrowLeft' && textarea.selectionStart === 0 && index > 0) {
        event.preventDefault()
        const previous = blockMarkdown(valueRef.current[index - 1]).trim()
        moveCaret(index - 1, previous.length)
        return
      }
      if (event.key === 'ArrowRight' && textarea.selectionStart === draftRef.current.length && index < valueRef.current.length - 1) {
        event.preventDefault()
        moveCaret(index + 1, 0)
        return
      }
      if (event.key === 'ArrowUp') {
        const before = draftRef.current.slice(0, textarea.selectionStart)
        if (before.includes('\n') || index === 0) return
        event.preventDefault()
        if (event.shiftKey) {
          suppressBlurRef.current = true
          const committed = commitIndex(index, draftRef.current)
          valueRef.current = committed
          editingRef.current = null
          setEditingIndex(null)
          emit(committed)
          rememberSelection({ anchor: index, focus: index - 1 })
          containerRef.current?.focus({ preventScroll: true })
          requestAnimationFrame(() => {
            suppressBlurRef.current = false
          })
          return
        }
        const previous = blockMarkdown(valueRef.current[index - 1]).trim()
        const lastLine = previous.split('\n').pop() ?? ''
        moveCaret(index - 1, previous.length - lastLine.length + Math.min(before.length, lastLine.length))
        return
      }
      if (event.key === 'ArrowDown') {
        const after = draftRef.current.slice(textarea.selectionStart)
        if (after.includes('\n') || index >= valueRef.current.length - 1) return
        event.preventDefault()
        if (event.shiftKey) {
          suppressBlurRef.current = true
          const committed = commitIndex(index, draftRef.current)
          valueRef.current = committed
          editingRef.current = null
          setEditingIndex(null)
          emit(committed)
          rememberSelection({ anchor: index, focus: index + 1 })
          containerRef.current?.focus({ preventScroll: true })
          requestAnimationFrame(() => {
            suppressBlurRef.current = false
          })
          return
        }
        const column = draftRef.current.slice(0, textarea.selectionStart).split('\n').pop()?.length ?? 0
        const next = blockMarkdown(valueRef.current[index + 1]).trim()
        const firstLine = next.split('\n')[0] ?? ''
        moveCaret(index + 1, Math.min(column, firstLine.length))
      }
    }

    const onContainerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.target instanceof HTMLTextAreaElement) return
      const current = selectionRef.current
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        rememberSelection({ anchor: 0, focus: Math.max(0, valueRef.current.length - 1) })
        return
      }
      if (!current) {
        if (event.key === 'Backspace' || event.key === 'Delete') event.preventDefault()
        return
      }
      const { start, end } = selectionBounds(current)
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault()
        deleteSelection(start, end)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        rememberSelection(null)
        return
      }
      if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && event.shiftKey) {
        event.preventDefault()
        const delta = event.key === 'ArrowDown' ? 1 : -1
        const focus = Math.max(0, Math.min(valueRef.current.length - 1, current.focus + delta))
        rememberSelection({ anchor: current.anchor, focus })
        return
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault()
        rememberSelection(null)
        const target = event.key === 'ArrowUp' ? start : end
        const markdown = blockMarkdown(valueRef.current[target] ?? emptyParagraph()).trim()
        caretRef.current = event.key === 'ArrowUp' ? markdown.length : 0
        beginEdit(target)
        return
      }
      if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        replaceSelectionWithText(start, end, event.key)
      }
    }

    return (
      <div
        ref={containerRef}
        tabIndex={readOnly ? undefined : 0}
        className="flex flex-col gap-1 outline-none"
        onKeyDown={readOnly ? undefined : onContainerKeyDown}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onPaste={(event) => {
          if (event.target instanceof HTMLTextAreaElement) return
          const current = selectionRef.current
          onPasteImages(event, current ? selectionBounds(current).end + 1 : valueRef.current.length)
        }}
      >
        {blocks.map((block, index) => {
          const markdown = blockMarkdown(block)
          const editing = editingIndex === index
          const bounds = selection ? selectionBounds(selection) : null
          const selected = bounds !== null && index >= bounds.start && index <= bounds.end && !editing
          return (
            <div key={index} data-block-index={index} className={`group relative rounded-md ${selected ? 'bg-sky-100' : ''}`}>
              {dropIndex === index && (
                <div className="pointer-events-none absolute -top-1 left-0 right-0 z-20 h-0.5 rounded bg-sky-500" />
              )}
              {!readOnly && (
                <div className="absolute right-0 top-0 z-10 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <button
                    type="button"
                    draggable
                    data-block-control="true"
                    aria-label="Drag to move block"
                    title="Drag to move"
                    className="cursor-grab rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-800 active:cursor-grabbing"
                    onDragStart={(event) => {
                      const current = selectionRef.current
                      const bounds = current ? selectionBounds(current) : null
                      const range = bounds && index >= bounds.start && index <= bounds.end
                        ? bounds
                        : { start: index, end: index }
                      blockDragSourceRef.current = range
                      event.dataTransfer.effectAllowed = 'move'
                      event.dataTransfer.setData(BLOCK_DRAG_TYPE, String(index))
                      const blockElement = event.currentTarget.closest('[data-block-index]')
                      if (blockElement) event.dataTransfer.setDragImage(blockElement, 16, 12)
                    }}
                    onDragEnd={() => {
                      blockDragSourceRef.current = null
                      setDropIndex(null)
                    }}
                  >
                    ⋮⋮
                  </button>
                  <button
                    type="button"
                    className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600 shadow-sm hover:bg-gray-50"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      if (editing) {
                        stopEditing(index, draftRef.current)
                      } else {
                        beginEdit(index)
                      }
                    }}
                  >
                    {editing ? 'Preview' : 'Edit'}
                  </button>
                </div>
              )}
              {editing ? (
                <textarea
                  ref={textareaRef}
                  value={draft}
                  autoFocus
                  aria-label="Edit markdown block"
                  placeholder={placeholder}
                  onChange={(event) => {
                    draftRef.current = event.target.value
                    setDraft(event.target.value)
                    rememberTextRange(event.target.selectionStart, event.target.selectionEnd)
                  }}
                  onSelect={(event) => {
                    rememberTextRange(event.currentTarget.selectionStart, event.currentTarget.selectionEnd)
                  }}
                  onKeyUp={(event) => {
                    rememberTextRange(event.currentTarget.selectionStart, event.currentTarget.selectionEnd)
                  }}
                  onMouseUp={(event) => {
                    rememberTextRange(event.currentTarget.selectionStart, event.currentTarget.selectionEnd)
                  }}
                  onPointerDown={(event) => {
                    textGestureRef.current = {
                      active: true,
                      index,
                      x: event.clientX,
                      y: event.clientY,
                    }
                  }}
                  onKeyDown={onTextKeyDown}
                  onPaste={(event) => onPasteImages(event, index + 1)}
                  onBlur={(event) => {
                    if (suppressBlurRef.current) return
                    if (editingRef.current !== index) return
                    const next = event.relatedTarget
                    if (next instanceof HTMLElement && (next.dataset.blockControl === 'true' || next.closest('[data-format-control]'))) return
                    stopEditing(index, draftRef.current)
                  }}
                  className="w-full resize-none rounded-md border border-gray-200 bg-white p-3 font-mono text-sm leading-6 text-gray-800 outline-none focus:border-gray-400"
                />
              ) : (
                <div
                  className={readOnly ? '' : `cursor-text select-none rounded-md px-1 py-1 ${selected ? '' : 'hover:bg-gray-50'}`}
                  onPointerDown={(event) => {
                    if (readOnly || event.button !== 0) return
                    const target = event.target
                    if (target instanceof Element && target.closest('a, button')) return
                    if (event.shiftKey && selectionRef.current) {
                      event.preventDefault()
                      rememberSelection({ anchor: selectionRef.current.anchor, focus: index })
                      containerRef.current?.focus({ preventScroll: true })
                      return
                    }
                    event.preventDefault()
                    dragRef.current = { active: true, anchor: index, focus: index, moved: false }
                  }}
                >
                  {markdown ? (
                    <MarkdownRenderer>{markdown}</MarkdownRenderer>
                  ) : (
                    <p className="text-gray-400">{placeholder}</p>
                  )}
                </div>
              )}
              {renderBlockFooter?.(index)}
            </div>
          )
        })}
        {dropIndex !== null && dropIndex >= blocks.length && (
          <div className="pointer-events-none h-0.5 rounded bg-sky-500" />
        )}
        {!readOnly && (
          <button
            type="button"
            data-block-control="true"
            className="mt-2 w-fit rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              const current = editingRef.current !== null
                ? commitIndex(editingRef.current, draftRef.current)
                : valueRef.current
              const next = [...current, emptyParagraph()]
              draftRef.current = ''
              editingRef.current = next.length - 1
              setDraft('')
              setEditingIndex(next.length - 1)
              emit(next)
            }}
          >
            Add block
          </button>
        )}
        {!readOnly && (
          <p className="mt-1 text-xs text-gray-400">
            Drag across blocks to select them. Drag ⋮⋮ to move a block. Drop or paste images to add them; they upload to IPFS when you propose or share.
          </p>
        )}
      </div>
    )
  },
)

export default MarkdownBlockEditor
