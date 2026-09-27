const IMAGE_SERVICE_URL = '/api/crm/upload';
const MAX_PARALLEL_UPLOADS = 3;
const CHUNK_SIZE = 5;

export interface UploadResponse {
  success: boolean;
  message?: string;
  filesUploaded?: number;
  urls?: string[];
  files?: Array<{
    filename: string;
    originalName: string;
    url: string;
    size: number;
  }>;
  warnings?: string;
  error?: string;
  details?: string;
}

export class ImageService {
  // Target size for compression (500KB)
  private static readonly TARGET_SIZE_BYTES = 500 * 1024;

  // Quality steps for progressive compression
  private static readonly QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25];

  // Max width steps for further size reduction
  private static readonly WIDTH_STEPS = [1920, 1600, 1280, 1024, 800];

  private static async compressImage(file: File, maxWidth = 1920, quality = 0.85): Promise<File> {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Compress image to target size (<500KB) using progressive quality and size reduction
   * @param file - The image file to compress
   * @param targetSizeBytes - Target file size in bytes (default: 500KB)
   * @returns Compressed file
   */
  static async compressToTarget(file: File, targetSizeBytes = this.TARGET_SIZE_BYTES): Promise<File> {
    // If file is already under target, just do basic optimization
    if (file.size <= targetSizeBytes) {
      return this.compressImage(file, 1920, 0.9);
    }

    return new Promise((resolve) => {
      const img = document.createElement('img');
      const objectUrl = URL.createObjectURL(file);

      img.onload = async () => {
        URL.revokeObjectURL(objectUrl);

        // Try different quality and width combinations
        for (const maxWidth of this.WIDTH_STEPS) {
          for (const quality of this.QUALITY_STEPS) {
            const compressed = await this.compressWithSettings(img, file.name, maxWidth, quality);

            if (compressed.size <= targetSizeBytes) {
              console.log(`[ImageService] Compressed ${file.name}: ${(file.size / 1024).toFixed(1)}KB → ${(compressed.size / 1024).toFixed(1)}KB (quality: ${quality}, width: ${maxWidth})`);
              resolve(compressed);
              return;
            }
          }
        }

        // If we still can't get under target, return the best we could do
        const bestEffort = await this.compressWithSettings(img, file.name, 800, 0.2);
        console.log(`[ImageService] Best effort compression for ${file.name}: ${(file.size / 1024).toFixed(1)}KB → ${(bestEffort.size / 1024).toFixed(1)}KB`);
        resolve(bestEffort);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        console.warn(`[ImageService] Failed to load image for compression: ${file.name}`);
        resolve(file);
      };

      img.src = objectUrl;
    });
  }

  private static compressWithSettings(img: HTMLImageElement, filename: string, maxWidth: number, quality: number): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], filename, { type: 'image/jpeg' }));
          } else {
            // Fallback: create a minimal file if blob creation fails
            resolve(new File([], filename, { type: 'image/jpeg' }));
          }
        },
        'image/jpeg',
        quality
      );
    });
  }

  private static async uploadChunk(propertyId: string, files: File[]): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('propertyId', propertyId);
    files.forEach(file => formData.append('files', file));

    const response = await fetch(IMAGE_SERVICE_URL, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error(`Image service returned invalid response (${response.status})`);
    }

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Upload failed');
    return result;
  }

  static async uploadImages(propertyId: string, files: File[]): Promise<UploadResponse> {
    try {
      // Compress images to target size (<500KB) in parallel
      const compressionPromises = files.map(file =>
        file.type.startsWith('image/') ? this.compressToTarget(file) : Promise.resolve(file)
      );
      const compressedFiles = await Promise.all(compressionPromises);

      // Split into chunks and upload in parallel batches
      const chunks: File[][] = [];
      for (let i = 0; i < compressedFiles.length; i += CHUNK_SIZE) {
        chunks.push(compressedFiles.slice(i, i + CHUNK_SIZE));
      }

      const allUrls: string[] = [];
      let totalUploaded = 0;

      // Process chunks with limited parallelism
      for (let i = 0; i < chunks.length; i += MAX_PARALLEL_UPLOADS) {
        const batch = chunks.slice(i, i + MAX_PARALLEL_UPLOADS);
        const results = await Promise.all(
          batch.map(chunk => this.uploadChunk(propertyId, chunk))
        );

        results.forEach(result => {
          if (result.urls) allUrls.push(...result.urls);
          totalUploaded += result.filesUploaded || 0;
        });
      }

      return {
        success: true,
        filesUploaded: totalUploaded,
        urls: allUrls
      };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to image service');
      }
      throw error;
    }
  }

  static getImageUrl(propertyId: string, filename: string): string {
    // Generate URLs that match the FeaturedListings serving pattern
    return `${IMAGE_SERVICE_URL}/images/${propertyId}/${filename}`;
  }

  static isLegacyImage(imagePath: string): boolean {
    // Legacy check for backward compatibility
    return imagePath.includes('/') || imagePath.startsWith('Properties/');
  }

  static extractPropertyIdAndFilename(imagePath: string): { propertyId: string; filename: string } | null {
    // Handle different image path formats
    if (imagePath.startsWith('/api/images/')) {
      const parts = imagePath.replace('/api/images/', '').split('/');
      if (parts.length >= 2) {
        return {
          propertyId: parts[0],
          filename: parts.slice(1).join('/')
        };
      }
    }

    // Handle direct service URLs
    if (imagePath.includes('/images/')) {
      const parts = imagePath.split('/images/')[1].split('/');
      if (parts.length >= 2) {
        return {
          propertyId: parts[0],
          filename: parts.slice(1).join('/')
        };
      }
    }

    return null;
  }
}