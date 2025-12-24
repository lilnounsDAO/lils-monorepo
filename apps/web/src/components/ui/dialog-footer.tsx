/**
 * Dialog Footer Component (Tailwind CSS Version)
 */

import React from 'react'
import Button, { ButtonProps } from './button'

export interface DialogFooterProps {
  cancel?: () => void
  cancelButtonLabel?: string
  submitButtonLabel?: string
  submitButtonProps?: ButtonProps
}

const DialogFooter: React.FC<DialogFooterProps> = ({
  cancel,
  cancelButtonLabel = 'Cancel',
  submitButtonLabel = 'Submit',
  submitButtonProps
}) => {
  return (
    <div className="flex justify-end gap-4 mt-8 pt-8 border-t border-gray-200">
      {cancel && (
        <Button type="button" size="medium" onClick={cancel}>
          {cancelButtonLabel}
        </Button>
      )}
      <Button variant="primary" size="medium" {...submitButtonProps}>
        {submitButtonLabel}
      </Button>
    </div>
  )
}

export default DialogFooter
