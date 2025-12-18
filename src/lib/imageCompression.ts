/**
 * Compress an image file using canvas
 * Reduces file size while maintaining visual quality
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

const defaultOptions: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  maxSizeKB: 500,
};

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const { maxWidth, maxHeight, quality, maxSizeKB } = { ...defaultOptions, ...options };

  // Skip compression for non-image files or very small files
  if (!file.type.startsWith('image/') || file.size < 50 * 1024) {
    return file;
  }

  // Skip compression for GIFs (loses animation) and SVGs
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth! || height > maxHeight!) {
        const ratio = Math.min(maxWidth! / width, maxHeight! / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Create canvas and draw image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Try to achieve target file size by adjusting quality
      let currentQuality = quality!;
      const minQuality = 0.5;

      const compressWithQuality = (q: number): Promise<Blob | null> => {
        return new Promise((res) => {
          canvas.toBlob(
            (blob) => res(blob),
            'image/jpeg',
            q
          );
        });
      };

      const attemptCompression = async () => {
        let blob = await compressWithQuality(currentQuality);

        // If still too large and quality can be reduced, try again
        while (
          blob &&
          maxSizeKB &&
          blob.size > maxSizeKB * 1024 &&
          currentQuality > minQuality
        ) {
          currentQuality -= 0.1;
          blob = await compressWithQuality(currentQuality);
        }

        if (blob && blob.size < file.size) {
          // Create new file with compressed data
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '.jpg'),
            { type: 'image/jpeg', lastModified: Date.now() }
          );
          
          console.log(
            `Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`
          );
          
          resolve(compressedFile);
        } else {
          // If compression didn't help, return original
          resolve(file);
        }
      };

      attemptCompression().catch(() => resolve(file));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Return original on error
    };

    img.src = url;
  });
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}

/**
 * Resize a favicon image while maintaining PNG format and transparency
 * Only resizes the image, does not compress or change format
 */
export async function resizeFavicon(
  file: File,
  size: number = 64
): Promise<File> {
  // Return original for SVGs (vector, doesn't need resizing)
  if (file.type === 'image/svg+xml') {
    return file;
  }

  // Only process PNG and ICO files
  if (file.type !== 'image/png' && file.type !== 'image/x-icon') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Create canvas with desired size
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Clear canvas to transparent
      ctx.clearRect(0, 0, size, size);

      // Enable high quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Calculate aspect ratio to fit image in square
      const { width, height } = img;
      const aspectRatio = width / height;
      
      let drawWidth = size;
      let drawHeight = size;
      let offsetX = 0;
      let offsetY = 0;

      if (aspectRatio > 1) {
        // Wider than tall
        drawHeight = size / aspectRatio;
        offsetY = (size - drawHeight) / 2;
      } else if (aspectRatio < 1) {
        // Taller than wide
        drawWidth = size * aspectRatio;
        offsetX = (size - drawWidth) / 2;
      }

      // Draw image centered and scaled
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // Convert to PNG blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '.png'),
              { type: 'image/png', lastModified: Date.now() }
            );
            
            console.log(
              `Favicon resized to ${size}x${size}px, size: ${(resizedFile.size / 1024).toFixed(1)}KB`
            );
            
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        },
        'image/png',
        1.0 // Maximum quality for PNG
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}
