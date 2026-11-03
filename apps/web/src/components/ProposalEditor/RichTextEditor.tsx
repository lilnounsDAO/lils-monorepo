import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { createEditor, Descendant, Editor, Transforms, Range } from 'slate'
import { Slate, withReact, ReactEditor } from 'slate-react'
import { withHistory } from 'slate-history'
import { cn } from '@/utils/shadcn'
import RichTextToolbar from './RichTextToolbar'
import LinkDialog from './LinkDialog'
import ImageDialog from './ImageDialog'
import MarkdownBlockEditor, { type ActiveFormats, emptyActiveFormats, type MarkdownBlockEditorHandle, type MarkdownBlockFormat } from './MarkdownBlockEditor'

// Types
export type RichTextElement = {
  type: 'paragraph' | 'heading-one' | 'heading-two' | 'heading-three' | 'bulleted-list' | 'numbered-list' | 'list-item' | 'code-block' | 'block-quote' | 'link' | 'image'
  children: RichTextNode[]
  level?: number
  url?: string
  caption?: string
}

export type RichTextText = {
  text: string
  bold?: boolean
  italic?: boolean
  code?: boolean
  underline?: boolean
  strikethrough?: boolean
}

export type RichTextNode = RichTextElement | RichTextText

// Create empty paragraph
export const createEmptyParagraphElement = (): RichTextElement => ({
  type: 'paragraph',
  children: [{ text: '' }],
})

interface RichTextEditorProps {
  value: Descendant[]
  onChange: (value: Descendant[]) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
  renderBlockFooter?: (index: number) => React.ReactNode
  toolbarSlot?: HTMLElement | null
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing...',
  className,
  readOnly = false,
  renderBlockFooter,
  toolbarSlot = null,
}) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 })
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [editorFocused, setEditorFocused] = useState(false)
  const blocksRef = useRef<MarkdownBlockEditorHandle>(null)
  const [formats, setFormats] = useState<ActiveFormats>(emptyActiveFormats)

  const onActiveFormats = useCallback((next: ActiveFormats) => {
    setFormats((prev) => (
      prev.bold === next.bold
      && prev.italic === next.italic
      && prev.link === next.link
      && prev.headingOne === next.headingOne
      && prev.headingTwo === next.headingTwo
        ? prev
        : next
    ))
  }, [])

  const isMarkActive = useCallback((format: string) => {
    if (format === 'bold') return formats.bold
    if (format === 'italic') return formats.italic
    if (format === 'link') return formats.link
    return false
  }, [formats])

  const isBlockActive = useCallback((format: string) => {
    if (format === 'heading-one') return formats.headingOne
    if (format === 'heading-two') return formats.headingTwo
    return false
  }, [formats])

  const toggleMark = useCallback((format: string) => {
    if (format === 'bold' || format === 'italic' || format === 'link') {
      blocksRef.current?.toggleInline(format)
    }
  }, [])

  const toggleBlock = useCallback((format: string) => {
    blocksRef.current?.applyBlock(format as MarkdownBlockFormat)
  }, [])

  // Sync editor content when value prop changes externally
  useEffect(() => {
    if (!editor) return
    
    // Check if the current editor content differs from the prop value
    const currentContent = JSON.stringify(editor.children)
    const newContent = JSON.stringify(value)
    
    if (currentContent !== newContent) {
      // Use withoutNormalizing to batch operations
      Editor.withoutNormalizing(editor, () => {
        // Remove all existing children
        const path = [0]
        while (editor.children.length > 0) {
          Transforms.removeNodes(editor, { at: path })
        }
        
        // Insert new children
        if (value.length > 0) {
          Transforms.insertNodes(editor, value, { at: [0] })
        } else {
          // If value is empty, insert empty paragraph
          Transforms.insertNodes(editor, createEmptyParagraphElement(), { at: [0] })
        }
      })
    }
  }, [editor, value])

  // Update toolbar position when selection changes
  const updateToolbar = useCallback(() => {
    const { selection } = editor

    let focused = false
    try {
      focused = ReactEditor.isFocused(editor)
    } catch {
      focused = false
    }

    if (
      !selection ||
      !focused ||
      Range.isCollapsed(selection) ||
      Editor.string(editor, selection) === ''
    ) {
      setShowToolbar(false)
      return
    }

    const domSelection = window.getSelection()
    if (!domSelection || domSelection.rangeCount === 0) {
      setShowToolbar(false)
      return
    }

    const domRange = domSelection.getRangeAt(0)
    const rect = domRange.getBoundingClientRect()

    setToolbarPosition({
      top: rect.top + window.pageYOffset - 50,
      left: rect.left + window.pageXOffset + rect.width / 2,
    })
    setSelectedText(Editor.string(editor, selection))
    setShowToolbar(true)
  }, [editor])

  // Insert link handler
  const handleInsertLink = useCallback(
    (text: string, url: string) => {
      blocksRef.current?.insertMarkdown(`[${text}](${url})`)
      setIsLinkDialogOpen(false)
    },
    []
  )

  const handleInsertImage = useCallback(
    (url: string, caption?: string) => {
      const alt = caption ?? ''
      blocksRef.current?.insertMarkdown(`![${alt}](${url})`)
      setIsImageDialogOpen(false)
    },
    []
  )

  return (
    <div className={cn('w-full relative', className)} style={{ flex: 1, minHeight: '12rem' }}>
      <Slate
        editor={editor}
        initialValue={value}
        onChange={() => {
          updateToolbar()
        }}
      >
        <MarkdownBlockEditor
          ref={blocksRef}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          onEditingChange={setEditorFocused}
          onActiveFormats={onActiveFormats}
          renderBlockFooter={renderBlockFooter}
        />

        {/* Floating Toolbar - Nouns Camp Style */}
        {showToolbar && !readOnly && editorFocused && (
          <div
            style={{
              position: 'absolute',
              top: `${toolbarPosition.top}px`,
              left: `${toolbarPosition.left}px`,
              transform: 'translateX(-50%)',
              zIndex: 1000,
              transition: '0.1s opacity ease-out'
            }}
          >
            <div style={{
              display: 'flex',
              gap: '1.6rem',
              maxWidth: 'calc(100vw - 3.2rem)',
              width: 'max-content'
            }}>
              <div style={{
                padding: '0.3rem',
                borderRadius: '0.6rem',
                background: 'rgb(255, 255, 255)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}>
                <RichTextToolbar
                  onInsertLink={() => setIsLinkDialogOpen(true)}
                  onInsertImage={() => setIsImageDialogOpen(true)}
                  isMarkActive={isMarkActive}
                  toggleMark={toggleMark}
                  isBlockActive={isBlockActive}
                  toggleBlock={toggleBlock}
                />
              </div>
            </div>
          </div>
        )}
        
        {!readOnly && toolbarSlot && createPortal(
          <div data-format-control="true" className="rounded-lg border border-gray-200 bg-white">
            <RichTextToolbar
              onInsertLink={() => setIsLinkDialogOpen(true)}
              onInsertImage={() => setIsImageDialogOpen(true)}
              isMarkActive={isMarkActive}
              toggleMark={toggleMark}
              isBlockActive={isBlockActive}
              toggleBlock={toggleBlock}
            />
          </div>,
          toolbarSlot,
        )}
        {!readOnly && !toolbarSlot && (
          <div style={{
            position: 'sticky',
            bottom: 0,
            maxWidth: 'calc(100vw - 3.2rem)',
            width: 'max-content',
            padding: '1.6rem 0',
          }}>
            <div style={{
              padding: '0.3rem',
              borderRadius: '0.6rem',
              background: 'rgb(255, 255, 255)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              <RichTextToolbar
                onInsertLink={() => setIsLinkDialogOpen(true)}
                onInsertImage={() => setIsImageDialogOpen(true)}
                isMarkActive={isMarkActive}
                toggleMark={toggleMark}
                isBlockActive={isBlockActive}
                toggleBlock={toggleBlock}
              />
            </div>
          </div>
        )}
      </Slate>

      {/* Link Dialog */}
      <LinkDialog
        isOpen={isLinkDialogOpen}
        onClose={() => setIsLinkDialogOpen(false)}
        onInsert={handleInsertLink}
        initialText={selectedText}
      />

      {/* Image Dialog */}
      <ImageDialog
        isOpen={isImageDialogOpen}
        onClose={() => setIsImageDialogOpen(false)}
        onInsert={handleInsertImage}
      />
    </div>
  )
}

export default RichTextEditor
