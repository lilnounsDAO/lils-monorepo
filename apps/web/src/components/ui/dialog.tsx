/**
 * Dialog Component (Tailwind CSS Version)
 * No Emotion dependency - uses Tailwind classes + Radix UI
 */

import React from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
import { cn } from '@/utils/shadcn'

export interface DialogProps {
  isOpen: boolean
  onRequestClose: () => void
  width?: string
  className?: string
  children: (props: { titleProps: { id: string } }) => React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onRequestClose,
  width = '32rem',
  className,
  children
}) => {
  const titleId = React.useId()

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={(open) => !open && onRequestClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-black/50 animate-in fade-in z-[1000]" />
        <RadixDialog.Content
          aria-labelledby={titleId}
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[90vw] max-h-[85vh]',
            'bg-white rounded-xl shadow-2xl',
            'z-[1001]',
            'animate-in zoom-in-95 fade-in slide-in-from-bottom-2',
            className
          )}
          style={{ maxWidth: width }}
        >
          {children({ titleProps: { id: titleId } })}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

export default Dialog
