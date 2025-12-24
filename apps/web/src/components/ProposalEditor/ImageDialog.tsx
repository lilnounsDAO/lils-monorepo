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

interface ImageDialogProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (url: string, caption?: string) => void
  initialUrl?: string
  initialCaption?: string
}

const ImageDialog: React.FC<ImageDialogProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialUrl = '',
  initialCaption = '',
}) => {
  const [url, setUrl] = useState(initialUrl)
  const [caption, setCaption] = useState(initialCaption)

  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl)
      setCaption(initialCaption)
    }
  }, [isOpen, initialUrl, initialCaption])

  const handleInsert = () => {
    if (url.trim()) {
      onInsert(url.trim(), caption.trim() || undefined)
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim()) {
      e.preventDefault()
      handleInsert()
    }
  }

  return (
    <DrawerDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerDialogContent className="md:max-h-[60vh] md:max-w-[min(95vw,500px)]">
        <DrawerDialogTitle className="sr-only">
          Insert image
        </DrawerDialogTitle>
        <DrawerDialogContentInner className="p-0 md:flex-row">
          <div className="w-full pl-6 pt-6 heading-1 md:hidden">
            Insert image
          </div>
          
          <div className="flex w-full flex-auto flex-col gap-6 overflow-visible px-6 pb-6 scrollbar-track-transparent md:h-full md:overflow-y-auto md:px-8 md:pt-12">
            <h2 className="hidden md:block">Insert image</h2>
            
            <div className="space-y-6">
              {/* URL Input */}
              <div className="space-y-3">
                <Label htmlFor="image-url" className="text-sm font-medium text-gray-700">URL</Label>
                <Input
                  id="image-url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>

              {/* Caption Input */}
              <div className="space-y-3">
                <Label htmlFor="image-caption" className="text-sm font-medium text-gray-700">Caption (optional)</Label>
                <Input
                  id="image-caption"
                  type="text"
                  placeholder="Describe the image"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-8">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleInsert} disabled={!url.trim()}>
                Insert image
              </Button>
            </div>
          </div>
        </DrawerDialogContentInner>
      </DrawerDialogContent>
    </DrawerDialog>
  )
}

export default ImageDialog
