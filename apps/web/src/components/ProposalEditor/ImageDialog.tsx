import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DrawerDialog,
  DrawerDialogContent,
  DrawerDialogContentInner,
  DrawerDialogTitle,
} from "../ui/DrawerDialog"
import { imageAltFromName, isImageFile, MAX_IMAGE_BYTES, storeLocalImageUrl } from '@/utils/localImages'

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
  const [local, setLocal] = useState<{ name: string, preview: string } | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl)
      setCaption(initialCaption)
      setLocal(null)
      setFileError(null)
      setDragging(false)
    }
  }, [isOpen, initialUrl, initialCaption])

  useEffect(() => {
    if (!local) return
    return () => URL.revokeObjectURL(local.preview)
  }, [local])

  // The file stays in this browser until the proposal is submitted or shared.
  const chooseFile = async (file: File | undefined) => {
    if (!file) return
    setFileError(null)
    if (!isImageFile(file)) {
      setFileError('Use a PNG, JPEG, GIF, or WebP image.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setFileError('Images must be under 5 MB.')
      return
    }
    try {
      const localUrl = await storeLocalImageUrl(file)
      setUrl(localUrl)
      setLocal({ name: file.name, preview: URL.createObjectURL(file) })
      if (!caption.trim()) setCaption(imageAltFromName(file.name))
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Could not add that image.')
    }
  }

  const clearFile = () => {
    setLocal(null)
    setUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

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
      <DrawerDialogContent className="md:max-h-[85vh] md:max-w-[min(95vw,500px)]">
        <DrawerDialogTitle className="sr-only">
          Insert image
        </DrawerDialogTitle>
        <DrawerDialogContentInner className="p-0 md:flex-row">
          <div className="w-full pl-6 pt-6 heading-1 md:hidden">
            Insert image
          </div>
          
          <div className="flex w-full flex-auto flex-col gap-6 overflow-visible px-6 pb-6 scrollbar-track-transparent md:h-full md:overflow-y-auto md:px-8 md:pt-10">
            <h2 className="hidden md:block">Insert image</h2>
            
            <div className="space-y-6">
              {/* File drop zone */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Upload</Label>
                {local ? (
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                    <img src={local.preview} alt="" className="h-16 w-16 rounded-md object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gray-800">{local.name}</p>
                      <p className="text-xs text-gray-500">Uploads to IPFS when you propose or share.</p>
                    </div>
                    <button type="button" onClick={clearFile} className="text-sm text-gray-500 hover:text-gray-800">
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      if (!e.dataTransfer.types.includes('Files')) return
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'copy'
                      setDragging(true)
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragging(false)
                      void chooseFile(e.dataTransfer.files[0])
                    }}
                    className={`flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${dragging ? 'border-gray-500 bg-gray-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    <span className="text-sm text-gray-800">Drop an image here or choose a file</span>
                    <span className="text-xs text-gray-500">PNG, JPEG, GIF or WebP, up to 5 MB</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => { void chooseFile(e.target.files?.[0]) }}
                />
                {fileError && <p className="text-sm text-red-600">{fileError}</p>}
              </div>

              {/* URL Input */}
              {!local && (
                <div className="space-y-3">
                  <Label htmlFor="image-url" className="text-sm font-medium text-gray-700">Or paste a URL</Label>
                  <Input
                    id="image-url"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              )}

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
            <div className="flex justify-end gap-3">
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
