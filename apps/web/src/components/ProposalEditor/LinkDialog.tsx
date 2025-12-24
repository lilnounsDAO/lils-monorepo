import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DrawerDialog,
  DrawerDialogContent,
  DrawerDialogContentInner,
  DrawerDialogTitle,
} from "../ui/DrawerDialog"

interface LinkDialogProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (text: string, url: string) => void
  initialText?: string
  initialUrl?: string
}

const LinkDialog: React.FC<LinkDialogProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialText = '',
  initialUrl = '',
}) => {
  const [text, setText] = useState(initialText)
  const [url, setUrl] = useState(initialUrl)

  useEffect(() => {
    if (isOpen) {
      setText(initialText)
      setUrl(initialUrl)
    }
  }, [isOpen, initialText, initialUrl])

  const handleInsert = () => {
    if (text.trim() && url.trim()) {
      onInsert(text.trim(), url.trim())
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && text.trim() && url.trim()) {
      e.preventDefault()
      handleInsert()
    }
  }

  return (
    <DrawerDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerDialogContent className="md:max-h-[60vh] md:max-w-[min(95vw,500px)]">
        <DrawerDialogTitle className="sr-only">
          Insert link
        </DrawerDialogTitle>
        <DrawerDialogContentInner className="p-0 md:flex-row">
          <div className="w-full pl-6 pt-6 heading-1 md:hidden">
            Insert link
          </div>
          
          <div className="flex w-full flex-auto flex-col gap-6 overflow-visible px-6 pb-6 scrollbar-track-transparent md:h-full md:overflow-y-auto md:px-8 md:pt-12">
            <h2 className="hidden md:block">Insert link</h2>
            
            <div className="space-y-6">
              {/* Text Input */}
              <div className="space-y-3">
                <Label htmlFor="link-text" className="text-sm font-medium text-gray-700">Text</Label>
                <Input
                  id="link-text"
                  type="text"
                  placeholder="Link text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>

              {/* URL Input */}
              <div className="space-y-3">
                <Label htmlFor="link-url" className="text-sm font-medium text-gray-700">URL</Label>
                <Input
                  id="link-url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-8">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button
                onClick={handleInsert}
                disabled={!text.trim() || !url.trim()}
              >
                Insert link
              </Button>
            </div>
          </div>
        </DrawerDialogContentInner>
      </DrawerDialogContent>
    </DrawerDialog>
  )
}

export default LinkDialog
