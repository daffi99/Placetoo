/**
 * Utility for handling clipboard image reading, pasting, and compression
 */

/**
 * Compresses an image File or Blob to a lightweight base64 Data URL using HTML5 Canvas
 */
export async function compressImageToDataUrl(
  fileOrBlob: Blob,
  maxWidth = 900,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Checks if a string looks like an image URL or base64 Data URL
 */
export function isImageUrl(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.startsWith('data:image/')) return true;
  if (/^https?:\/\/[^\s]+(?:\.jpg|\.jpeg|\.png|\.webp|\.gif|\bimage\b|\bphoto\b|[?&]img|[?&]url)/i.test(trimmed)) {
    return true;
  }
  // Generic URL fallback
  return /^https?:\/\/[^\s]+$/i.test(trimmed);
}

/**
 * Reads an image or image URL from the system clipboard (supports mobile & desktop)
 */
export async function readImageOrUrlFromClipboard(): Promise<{ type: 'image' | 'url'; data: string } | null> {
  // 1. Try reading clipboard items directly (for image binary blobs/screenshots)
  if (navigator.clipboard && navigator.clipboard.read) {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const dataUrl = await compressImageToDataUrl(blob);
          return { type: 'image', data: dataUrl };
        }
      }
    } catch (err) {
      // Permission prompt declined or unsupported format, try text fallback
      console.warn('navigator.clipboard.read() error:', err);
    }
  }

  // 2. Fallback to readText() (for copied image URLs)
  if (navigator.clipboard && navigator.clipboard.readText) {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (text && isImageUrl(text)) {
        return { type: 'url', data: text };
      }
    } catch (err) {
      console.warn('navigator.clipboard.readText() error:', err);
    }
  }

  return null;
}

/**
 * Extracts image file from React or DOM ClipboardEvent (Cmd+V / Ctrl+V / Paste)
 */
export async function extractImageFromClipboardEvent(
  e: React.ClipboardEvent | ClipboardEvent
): Promise<string | null> {
  const items = e.clipboardData?.items;
  if (!items) return null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile();
      if (blob) {
        return await compressImageToDataUrl(blob);
      }
    }
  }

  // Also check if plain text is an image URL
  const text = e.clipboardData?.getData('text');
  if (text && isImageUrl(text.trim())) {
    return text.trim();
  }

  return null;
}
