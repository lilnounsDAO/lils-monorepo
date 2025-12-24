import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { createEditor, Descendant, Editor, Transforms, Element as SlateElement, Node, Range } from 'slate'
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps, ReactEditor } from 'slate-react'
import { withHistory } from 'slate-history'
import isHotkey from 'is-hotkey'
import { cn } from '@/utils/shadcn'
import RichTextToolbar from './RichTextToolbar'
import LinkDialog from './LinkDialog'
import ImageDialog from './ImageDialog'

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

// Helper functions
const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format as keyof typeof marks] === true : false
}

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format)
  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

const isBlockActive = (editor: Editor, format: string) => {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    })
  )

  return !!match
}

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format)
  const isList = ['numbered-list', 'bulleted-list'].includes(format)

  Transforms.unwrapNodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && ['numbered-list', 'bulleted-list'].includes(n.type as string),
    split: true,
  })

  const newProperties: Partial<SlateElement> = {
    type: isActive ? 'paragraph' : (isList ? 'list-item' : format) as any,
  }

  Transforms.setNodes<SlateElement>(editor, newProperties)

  if (!isActive && isList) {
    const block = { type: format, children: [] } as any
    Transforms.wrapNodes(editor, block)
  }
}

// Create empty paragraph
export const createEmptyParagraphElement = (): RichTextElement => ({
  type: 'paragraph',
  children: [{ text: '' }],
})

// Render components - Nouns Camp Style
const Element = ({ attributes, children, element }: RenderElementProps) => {
  switch (element.type) {
    case 'heading-one':
      return (
        <h1 
          {...attributes} 
          style={{
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '1.6rem',
            lineHeight: '1.2',
            color: 'rgb(23, 23, 40)'
          }}
        >
          {children}
        </h1>
      )
    case 'heading-two':
      return (
        <h2 
          {...attributes} 
          style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '1.2rem',
            lineHeight: '1.3',
            color: 'rgb(23, 23, 40)'
          }}
        >
          {children}
        </h2>
      )
    case 'heading-three':
      return (
        <h3 
          {...attributes} 
          style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            marginBottom: '1rem',
            lineHeight: '1.4',
            color: 'rgb(23, 23, 40)'
          }}
        >
          {children}
        </h3>
      )
    case 'bulleted-list':
      return (
        <ul 
          {...attributes} 
          style={{
            listStyle: 'disc',
            paddingLeft: '2rem',
            marginBottom: '1.6rem',
            color: 'rgb(23, 23, 40)'
          }}
        >
          {children}
        </ul>
      )
    case 'numbered-list':
      return (
        <ol 
          {...attributes} 
          style={{
            listStyle: 'decimal',
            paddingLeft: '2rem',
            marginBottom: '1.6rem',
            color: 'rgb(23, 23, 40)'
          }}
        >
          {children}
        </ol>
      )
    case 'list-item':
      return (
        <li 
          {...attributes} 
          style={{
            marginBottom: '0.5rem',
            lineHeight: '1.6'
          }}
        >
          {children}
        </li>
      )
    case 'code-block':
      return (
        <pre 
          {...attributes} 
          style={{
            backgroundColor: 'rgb(248, 248, 248)',
            padding: '1.6rem',
            borderRadius: '0.6rem',
            marginBottom: '1.6rem',
            overflowX: 'auto',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
            fontSize: '0.875rem',
            lineHeight: '1.5'
          }}
        >
          <code>{children}</code>
        </pre>
      )
    case 'block-quote':
      return (
        <blockquote 
          {...attributes} 
          style={{
            borderLeft: '4px solid rgb(229, 229, 229)',
            paddingLeft: '1.6rem',
            fontStyle: 'italic',
            color: 'rgb(115, 115, 115)',
            marginBottom: '1.6rem',
            lineHeight: '1.6'
          }}
        >
          {children}
        </blockquote>
      )
    case 'link':
      return (
        <a
          {...attributes}
          href={element.url}
          style={{
            color: 'rgb(59, 130, 246)',
            textDecoration: 'underline'
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      )
    case 'image':
      return (
        <div 
          {...attributes} 
          contentEditable={false} 
          style={{
            margin: '1.6rem 0',
            textAlign: 'center'
          }}
        >
          <img
            src={element.url}
            alt={element.caption || ''}
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '0.6rem',
              background: 'rgb(248, 248, 248)'
            }}
          />
          {element.caption && (
            <p style={{
              fontSize: '0.875rem',
              color: 'rgb(115, 115, 115)',
              textAlign: 'center',
              marginTop: '0.8rem',
              fontStyle: 'italic'
            }}>
              {element.caption}
            </p>
          )}
          {children}
        </div>
      )
    default:
      return (
        <p 
          {...attributes} 
          style={{
            marginBottom: '1.6rem',
            lineHeight: '1.6',
            color: 'rgb(23, 23, 40)',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            maxWidth: '100%'
          }}
        >
          {children}
        </p>
      )
  }
}

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.bold) {
    children = <strong style={{ fontWeight: '700' }}>{children}</strong>
  }
  if (leaf.italic) {
    children = <em style={{ fontStyle: 'italic' }}>{children}</em>
  }
  if (leaf.code) {
    children = (
      <code style={{
        backgroundColor: 'rgb(248, 248, 248)',
        padding: '0.2rem 0.4rem',
        borderRadius: '0.3rem',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
        fontSize: '0.875em'
      }}>
        {children}
      </code>
    )
  }
  if (leaf.underline) {
    children = <u style={{ textDecoration: 'underline' }}>{children}</u>
  }
  if (leaf.strikethrough) {
    children = <span style={{ textDecoration: 'line-through' }}>{children}</span>
  }
  return <span {...attributes}>{children}</span>
}

interface RichTextEditorProps {
  value: Descendant[]
  onChange: (value: Descendant[]) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing...',
  className,
  readOnly = false,
}) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 })
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [editorFocused, setEditorFocused] = useState(false)

  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])

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
      
      // Move cursor to start
      Transforms.select(editor, Editor.start(editor, []))
    }
  }, [editor, value])

  // Update toolbar position when selection changes
  const updateToolbar = useCallback(() => {
    const { selection } = editor

    if (
      !selection ||
      !ReactEditor.isFocused(editor) ||
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

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Keyboard shortcuts
      if (isHotkey('mod+b', event as any)) {
        event.preventDefault()
        toggleMark(editor, 'bold')
      }
      if (isHotkey('mod+i', event as any)) {
        event.preventDefault()
        toggleMark(editor, 'italic')
      }
      if (isHotkey('mod+u', event as any)) {
        event.preventDefault()
        toggleMark(editor, 'underline')
      }
      if (isHotkey('mod+`', event as any)) {
        event.preventDefault()
        toggleMark(editor, 'code')
      }

      // Markdown shortcuts
      if (event.key === ' ') {
        const { selection } = editor
        if (selection) {
          const [start] = Editor.edges(editor, selection)
          const line = Editor.string(editor, Editor.range(editor, start, { anchor: { path: start.path, offset: 0 }, focus: start }))

          // Check for markdown shortcuts
          if (line === '#') {
            event.preventDefault()
            toggleBlock(editor, 'heading-one')
            Transforms.delete(editor, { at: { path: start.path, offset: 0 }, distance: 1 })
          } else if (line === '##') {
            event.preventDefault()
            toggleBlock(editor, 'heading-two')
            Transforms.delete(editor, { at: { path: start.path, offset: 0 }, distance: 2 })
          } else if (line === '###') {
            event.preventDefault()
            toggleBlock(editor, 'heading-three')
            Transforms.delete(editor, { at: { path: start.path, offset: 0 }, distance: 3 })
          } else if (line === '-' || line === '*') {
            event.preventDefault()
            toggleBlock(editor, 'bulleted-list')
            Transforms.delete(editor, { at: { path: start.path, offset: 0 }, distance: 1 })
          } else if (line.match(/^\d+\.$/)) {
            event.preventDefault()
            toggleBlock(editor, 'numbered-list')
            Transforms.delete(editor, { at: { path: start.path, offset: 0 }, distance: line.length })
          } else if (line === '>') {
            event.preventDefault()
            toggleBlock(editor, 'block-quote')
            Transforms.delete(editor, { at: { path: start.path, offset: 0 }, distance: 1 })
          } else if (line === '```') {
            event.preventDefault()
            toggleBlock(editor, 'code-block')
            Transforms.delete(editor, { at: { path: start.path, offset: 0 }, distance: 3 })
          }
        }
      }
    },
    [editor]
  )

  // Insert link handler
  const handleInsertLink = useCallback(
    (text: string, url: string) => {
      if (!editor.selection) return

      const link: RichTextElement = {
        type: 'link',
        url,
        children: [{ text }],
      }

      Transforms.insertNodes(editor, link)
      setIsLinkDialogOpen(false)
    },
    [editor]
  )

  // Insert image handler
  const handleInsertImage = useCallback(
    (url: string, caption?: string) => {
      const image: RichTextElement = {
        type: 'image',
        url,
        caption,
        children: [{ text: '' }],
      }

      Transforms.insertNodes(editor, image)
      setIsImageDialogOpen(false)
    },
    [editor]
  )

  return (
    <div className={cn('w-full relative', className)} style={{ flex: 1, minHeight: '12rem' }}>
      <Slate
        editor={editor}
        initialValue={value}
        onChange={(newValue) => {
          onChange(newValue)
          updateToolbar()
        }}
      >
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          onFocus={() => setEditorFocused(true)}
          onBlur={() => {
            setEditorFocused(false)
            setShowToolbar(false)
          }}
          readOnly={readOnly}
          className={cn(
            'outline-none w-full text-gray-800 bg-transparent border-none',
            readOnly && 'cursor-default'
          )}
          style={{
            fontSize: '16px',
            lineHeight: '1.6',
            padding: 0,
            minHeight: '12rem',
            color: 'rgb(23, 23, 40)'
          }}
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
                  isMarkActive={(format) => isMarkActive(editor, format)}
                  toggleMark={(format) => toggleMark(editor, format)}
                  isBlockActive={(format) => isBlockActive(editor, format)}
                  toggleBlock={(format) => toggleBlock(editor, format)}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Fixed Bottom Toolbar for Touch Devices */}
        {editorFocused && !readOnly && (
          <div style={{
            position: 'sticky',
            bottom: 0,
            maxWidth: 'calc(100vw - 3.2rem)',
            width: 'max-content',
            padding: '1.6rem 0',
            pointerEvents: showToolbar ? 'none' : 'auto',
            transition: '0.1s opacity ease-out',
            opacity: showToolbar ? 0 : 1
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
                isMarkActive={(format) => isMarkActive(editor, format)}
                toggleMark={(format) => toggleMark(editor, format)}
                isBlockActive={(format) => isBlockActive(editor, format)}
                toggleBlock={(format) => toggleBlock(editor, format)}
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
