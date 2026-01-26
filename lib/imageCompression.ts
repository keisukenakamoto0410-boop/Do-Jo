import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxWidthOrHeight?: number;
  maxSizeMB?: number;
  useWebWorker?: boolean;
  fileType?: string;
  initialQuality?: number;
}

const defaultOptions: CompressionOptions = {
  maxWidthOrHeight: 800,
  maxSizeMB: 0.2, // 200KB
  useWebWorker: true,
  fileType: 'image/webp',
  initialQuality: 0.8,
};

/**
 * Compress an image file for avatar upload
 * - Max width: 800px
 * - Max file size: 200KB
 * - Format: WebP (with JPEG fallback)
 * - Quality: 80%
 */
export async function compressAvatar(file: File): Promise<File> {
  try {
    // Check if WebP is supported
    const canvas = document.createElement('canvas');
    const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

    const options: CompressionOptions = {
      ...defaultOptions,
      fileType: supportsWebP ? 'image/webp' : 'image/jpeg',
    };

    const compressedFile = await imageCompression(file, options);

    // Generate new filename
    const extension = supportsWebP ? 'webp' : 'jpg';
    const newFileName = `avatar_${Date.now()}.${extension}`;

    return new File([compressedFile], newFileName, {
      type: compressedFile.type,
    });
  } catch (error) {
    console.error('Image compression failed:', error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Compress a study photo
 * - Max width: 800px
 * - Max file size: 500KB
 */
export async function compressStudyPhoto(file: File): Promise<File> {
  try {
    const canvas = document.createElement('canvas');
    const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

    const options: CompressionOptions = {
      maxWidthOrHeight: 800,
      maxSizeMB: 0.5, // 500KB
      useWebWorker: true,
      fileType: supportsWebP ? 'image/webp' : 'image/jpeg',
      initialQuality: 0.85,
    };

    const compressedFile = await imageCompression(file, options);

    const extension = supportsWebP ? 'webp' : 'jpg';
    const newFileName = `study_${Date.now()}.${extension}`;

    return new File([compressedFile], newFileName, {
      type: compressedFile.type,
    });
  } catch (error) {
    console.error('Image compression failed:', error);
    return file;
  }
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Check if file needs compression
 */
export function needsCompression(file: File, maxSizeKB: number = 100): boolean {
  return file.size > maxSizeKB * 1024;
}
