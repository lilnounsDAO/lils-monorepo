/**
 * Spinner Component (Tailwind CSS Version)
 */

import React from 'react'

export interface SpinnerProps {
  size?: string
  className?: string
}

const Spinner: React.FC<SpinnerProps> = ({ size = '2rem', className }) => {
  return (
    <div
      className={`border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin ${className || ''}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  )
}

export default Spinner
