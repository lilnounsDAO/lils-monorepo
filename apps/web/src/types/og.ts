// Stub type for ImageResponse (replaces next/og)
// In production, this would be handled by @vercel/og or similar
export class ImageResponse extends Response {
  constructor(
    element: React.ReactElement,
    options?: {
      width?: number;
      height?: number;
      fonts?: Array<{
        name: string;
        data: ArrayBuffer;
        style?: 'normal' | 'italic';
        weight?: number;
      }>;
    }
  ) {
    // This is a stub - actual implementation would be in Vite plugin or Netlify function
    super('', { status: 500, statusText: 'ImageResponse not implemented in Vite' });
  }
}

