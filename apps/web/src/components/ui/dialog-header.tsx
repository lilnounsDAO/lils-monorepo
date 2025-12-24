/**
 * Dialog Header Component (Tailwind CSS Version)
 */

import React from 'react'
import { Cross as CrossIcon } from './icons'

export interface DialogHeaderProps {
  title: string
  titleProps?: { id?: string }
  subtitle?: string
  dismiss?: () => void
}

const DialogHeader: React.FC<DialogHeaderProps> = ({ title, titleProps, subtitle, dismiss }) => {
  return (
    <div className="flex items-start justify-between mb-8">
      <div className="flex-1 min-w-0">
        <h2
          {...titleProps}
          className="text-2xl font-bold text-gray-900 m-0"
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm text-gray-600 m-0">
            {subtitle}
          </p>
        )}
      </div>

      {dismiss && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close dialog"
          className="p-2 border-0 bg-transparent cursor-pointer rounded-md text-gray-600 flex items-center justify-center transition-all hover:bg-gray-100 hover:text-gray-900"
        >
          <CrossIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

export default DialogHeader
