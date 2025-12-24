import React from 'react'

// Replacement for Next.js Image component for Vite
interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  quality?: number
  unoptimized?: boolean
  style?: React.CSSProperties
  onClick?: () => void
  onLoad?: () => void
  onError?: () => void
}

export default function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  className,
  priority,
  fill,
  sizes,
  placeholder,
  blurDataURL,
  quality,
  unoptimized,
  style,
  onClick,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const imgStyle: React.CSSProperties = {
    ...style,
    ...(fill ? {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    } : {})
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={imgStyle}
      loading={priority ? 'eager' : 'lazy'}
      onClick={onClick}
      onLoad={onLoad}
      onError={onError}
      {...props}
    />
  )
}

// Export types for compatibility
export interface ImageProps extends OptimizedImageProps {}

// Local type definition (replaces next/image StaticImageData)
export interface StaticImageData {
  src: string
  height: number
  width: number
  blurDataURL?: string
  blurWidth?: number
  blurHeight?: number
}