import React, { useState, useRef, useEffect } from 'react'
import { Editor } from 'slate'
import { useSlate } from 'slate-react'
import { cn } from '@/utils/shadcn'
import { Bold, Italic, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'

interface RichTextToolbarProps {
  onInsertLink: () => void
  onInsertImage: () => void
  isMarkActive: (format: string) => boolean
  toggleMark: (format: string) => void
  isBlockActive: (format: string) => boolean
  toggleBlock: (format: string) => void
}

function FormatButton({
  active,
  title,
  onClick,
  children,
  style,
}: {
  active: boolean
  title: string
  onClick: () => void
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <button
      type="button"
      data-format-control="true"
      title={title}
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      onMouseEnter={(event) => {
        if (!active) event.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = active ? 'rgb(219, 234, 254)' : 'transparent'
      }}
      style={{
        padding: '0.35rem',
        borderRadius: '0.375rem',
        background: active ? 'rgb(219, 234, 254)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: active ? 'rgb(29, 78, 216)' : 'rgb(75, 75, 75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s, color 0.2s',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  onInsertLink,
  onInsertImage,
  isMarkActive,
  toggleMark,
  isBlockActive,
  toggleBlock,
}) => {
  const [showBlockDropdown, setShowBlockDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBlockDropdown(false)
      }
    }

    if (showBlockDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showBlockDropdown])

  const getActiveBlockLabel = () => {
    if (isBlockActive('heading-one')) return 'Heading 1'
    if (isBlockActive('heading-two')) return 'Heading 2'
    if (isBlockActive('heading-three')) return 'Heading 3'
    if (isBlockActive('code-block')) return 'Code'
    if (isBlockActive('block-quote')) return 'Quote'
    return 'Text'
  }

  const blockTypes = [
    { label: 'Text', value: 'paragraph' },
    { label: 'Heading 1', value: 'heading-one' },
    { label: 'Heading 2', value: 'heading-two' },
    { label: 'Heading 3', value: 'heading-three' },
    { label: 'Code', value: 'code-block' },
    { label: 'Quote', value: 'block-quote' },
  ]

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '0.25rem',
      background: 'transparent',
      padding: '0.3rem'
    }}>
      <FormatButton active={isMarkActive('bold')} title="Bold (⌘B)" onClick={() => toggleMark('bold')}>
        <Bold style={{ width: '1rem', height: '1rem' }} />
      </FormatButton>

      <FormatButton active={isMarkActive('italic')} title="Italic (⌘I)" onClick={() => toggleMark('italic')}>
        <Italic style={{ width: '1rem', height: '1rem' }} />
      </FormatButton>

      <FormatButton
        active={isBlockActive('heading-one')}
        title="Heading 1"
        onClick={() => toggleBlock('heading-one')}
        style={{ fontSize: '0.875rem', fontWeight: 700 }}
      >
        H1
      </FormatButton>

      <FormatButton
        active={isBlockActive('heading-two')}
        title="Heading 2"
        onClick={() => toggleBlock('heading-two')}
        style={{ fontSize: '0.875rem', fontWeight: 700 }}
      >
        H2
      </FormatButton>

      {/* Divider */}
      <div role="separator" style={{
        width: '1px',
        height: '1.5rem',
        backgroundColor: 'rgb(229, 229, 229)',
        margin: '0 0.15rem'
      }} />

      <FormatButton
        active={isMarkActive('link')}
        title="Link"
        onClick={() => {
          if (isMarkActive('link')) toggleMark('link')
          else onInsertLink()
        }}
      >
        <LinkIcon style={{ width: '1rem', height: '1rem' }} />
      </FormatButton>

      {/* Image */}
      <button
        type="button"
        style={{
          padding: '0.35rem',
          borderRadius: '0.375rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgb(75, 75, 75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s'
        }}
        onClick={onInsertImage}
        onMouseDown={(e) => e.preventDefault()}
        data-format-control="true"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
        title="Image"
      >
        <ImageIcon style={{ width: '1rem', height: '1rem' }} />
      </button>
    </div>
  )
}

export default RichTextToolbar
