// Client-side image size detection for Vite/SPA
export async function getImageSize(src: string): Promise<{ width?: number; height?: number }> {
  try {
    if (src.startsWith("data:image")) {
      // Handle base64 image by creating an Image element
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
          console.log("Error loading base64 image");
          resolve({ width: undefined, height: undefined });
        };
        img.src = src;
      });
    } else {
      // Handle remote image by creating an Image element
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
          console.log("Error loading remote image:", src);
          resolve({ width: undefined, height: undefined });
        };
        img.crossOrigin = "anonymous"; // Enable CORS if needed
        img.src = src;
      });
    }
  } catch (e) {
    console.log("Error fetching image size", e);
    return { width: undefined, height: undefined };
  }
}
