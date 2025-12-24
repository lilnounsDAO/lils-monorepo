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
      alignItems: 'center',
      gap: '0.5rem',
      background: 'transparent',
      padding: '0.3rem'
    }}>
      {/* Bold */}
      <button
        type="button"
        style={{
          padding: '0.5rem',
          borderRadius: '0.375rem',
          background: isMarkActive('bold') ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgb(75, 75, 75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s'
        }}
        onClick={() => toggleMark('bold')}
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={(e) => {
          if (!isMarkActive('bold')) {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isMarkActive('bold')) {
            e.currentTarget.style.background = 'transparent'
          }
        }}
        title="Bold (⌘B)"
      >
        <Bold style={{ width: '1rem', height: '1rem' }} />
      </button>

      {/* Italic */}
      <button
        type="button"
        style={{
          padding: '0.5rem',
          borderRadius: '0.375rem',
          background: isMarkActive('italic') ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgb(75, 75, 75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s'
        }}
        onClick={() => toggleMark('italic')}
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={(e) => {
          if (!isMarkActive('italic')) {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isMarkActive('italic')) {
            e.currentTarget.style.background = 'transparent'
          }
        }}
        title="Italic (⌘I)"
      >
        <Italic style={{ width: '1rem', height: '1rem' }} />
      </button>

      {/* Heading 1 */}
      <button
        type="button"
        style={{
          padding: '0.5rem',
          borderRadius: '0.375rem',
          background: isBlockActive('heading-one') ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgb(75, 75, 75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s',
          fontSize: '0.875rem',
          fontWeight: '700'
        }}
        onClick={() => toggleBlock('heading-one')}
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={(e) => {
          if (!isBlockActive('heading-one')) {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isBlockActive('heading-one')) {
            e.currentTarget.style.background = 'transparent'
          }
        }}
        title="Heading 1"
      >
        H1
      </button>

      {/* Heading 2 */}
      <button
        type="button"
        style={{
          padding: '0.5rem',
          borderRadius: '0.375rem',
          background: isBlockActive('heading-two') ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgb(75, 75, 75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s',
          fontSize: '0.875rem',
          fontWeight: '700'
        }}
        onClick={() => toggleBlock('heading-two')}
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={(e) => {
          if (!isBlockActive('heading-two')) {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isBlockActive('heading-two')) {
            e.currentTarget.style.background = 'transparent'
          }
        }}
        title="Heading 2"
      >
        H2
      </button>

      {/* Divider */}
      <div role="separator" style={{
        width: '1px',
        height: '1.5rem',
        backgroundColor: 'rgb(229, 229, 229)',
        margin: '0 0.5rem'
      }} />

      {/* Link */}
      <button
        type="button"
        style={{
          padding: '0.5rem',
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
        onClick={onInsertLink}
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
        title="Link"
      >
        <LinkIcon style={{ width: '1rem', height: '1rem' }} />
      </button>

      {/* Image */}
      <button
        type="button"
        style={{
          padding: '0.5rem',
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
