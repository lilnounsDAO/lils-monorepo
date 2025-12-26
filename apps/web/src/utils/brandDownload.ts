/**
 * Download brand asset utilities
 */

/**
 * Convert image URL to PNG blob
 */
export async function imageUrlToPng(imageUrl: string, width: number = 320, height: number = 320): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/png');
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download brand asset as PNG
 */
export async function downloadBrandAsPNG(imageUrl: string, name: string) {
  const blob = await imageUrlToPng(imageUrl, 320, 320);
  const filename = `${name.replace(/\s+/g, '-').toLowerCase()}.png`;
  downloadBlob(blob, filename);
}

/**
 * Download brand asset as SVG
 * For now, we'll fetch the SVG file if it exists, otherwise create a simple SVG wrapper
 */
export async function downloadBrandAsSVG(imageUrl: string, name: string) {
  // Try to fetch SVG version
  const svgUrl = imageUrl.replace('.png', '.svg');
  
  try {
    const response = await fetch(svgUrl);
    if (response.ok) {
      const svgText = await response.text();
      const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const filename = `${name.replace(/\s+/g, '-').toLowerCase()}.svg`;
      downloadBlob(blob, filename);
      return;
    }
  } catch (error) {
    // Fall through to create SVG wrapper
  }
  
  // Create SVG wrapper with embedded image
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="320" height="320" viewBox="0 0 320 320">
      <image href="${imageUrl}" width="320" height="320"/>
    </svg>
  `.trim();
  
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const filename = `${name.replace(/\s+/g, '-').toLowerCase()}.svg`;
  downloadBlob(blob, filename);
}

