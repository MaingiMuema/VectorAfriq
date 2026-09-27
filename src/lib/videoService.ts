const VIDEO_SERVICE_URL = '/api/crm/upload/videos';
const MAX_PARALLEL_UPLOADS = 2; // Lower parallelism for larger video files
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export interface VideoUploadResponse {
    success: boolean;
    message?: string;
    filesUploaded?: number;
    urls?: string[];
    files?: Array<{
        filename: string;
        originalName: string;
        url: string;
        size: number;
        duration?: number;
        thumbnail?: string;
    }>;
    warnings?: string;
    error?: string;
    details?: string;
}

export interface VideoMetadata {
    duration?: number;
    width?: number;
    height?: number;
    size: number;
    type: string;
}

export const VIDEO_SERVICE_VERSION = '1.0.3';

export class VideoService {
    static readonly VERSION = VIDEO_SERVICE_VERSION;
    /**
     * Extract basic metadata from a video file using the browser's video element
     */
    private static async getVideoMetadata(file: File): Promise<VideoMetadata> {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';

            video.onloadedmetadata = () => {
                URL.revokeObjectURL(video.src);
                resolve({
                    duration: video.duration,
                    width: video.videoWidth,
                    height: video.videoHeight,
                    size: file.size,
                    type: file.type
                });
            };

            video.onerror = () => {
                URL.revokeObjectURL(video.src);
                resolve({
                    size: file.size,
                    type: file.type
                });
            };

            video.src = URL.createObjectURL(file);
        });
    }

    /**
     * Validate a video file before upload
     */
    static validateVideo(file: File): { valid: boolean; error?: string } {
        const allowedTypes = ['video/mp4'];
        const allowedExtensions = ['.mp4'];

        // Check file type
        const isAllowedType = allowedTypes.includes(file.type);
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        const isAllowedExtension = allowedExtensions.includes(extension);

        if (!isAllowedType && !isAllowedExtension) {
            return {
                valid: false,
                error: `File "${file.name}" is not a supported video format. Please use MP4.`
            };
        }

        // Check file size
        if (file.size > MAX_VIDEO_SIZE) {
            return {
                valid: false,
                error: `File "${file.name}" is too large. Maximum size is 100MB.`
            };
        }

        return { valid: true };
    }

    /**
     * Upload a single video file
     */
    private static async uploadSingleVideo(propertyId: string, file: File): Promise<VideoUploadResponse> {
        console.log(`[VideoService v${this.VERSION}] Uploading: ${file.name} (${file.size} bytes)`);

        // Get metadata before upload
        let metadataString = "{}";
        try {
            const metadata = await this.getVideoMetadata(file);
            metadataString = JSON.stringify(metadata);
        } catch (metadataError) {
            console.warn(`[VideoService] Failed to get video metadata:`, metadataError);
        }

        // Add propertyId to URL as a fallback identifier
        const uploadUrl = `${VIDEO_SERVICE_URL}?propertyId=${encodeURIComponent(propertyId)}`;

        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: file, // Send file directly as body
            headers: {
                'x-property-id': propertyId,
                'x-video-metadata': metadataString,
                'x-file-name': file.name,
                'content-type': file.type || 'application/octet-stream',
            },
            credentials: 'include',
        });

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            throw new Error(`Video service returned invalid response (${response.status})`);
        }

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Upload failed');
        return result;
    }

    /**
     * Upload multiple video files with progress callback
     */
    static async uploadVideos(
        propertyId: string,
        files: File[],
        onProgress?: (progress: { uploaded: number; total: number; currentFile: string }) => void
    ): Promise<VideoUploadResponse> {
        try {
            // Validate all files first
            const validationErrors: string[] = [];
            const validFiles: File[] = [];

            for (const file of files) {
                const validation = this.validateVideo(file);
                if (!validation.valid && validation.error) {
                    validationErrors.push(validation.error);
                } else {
                    validFiles.push(file);
                }
            }

            if (validFiles.length === 0) {
                return {
                    success: false,
                    error: 'No valid video files to upload',
                    warnings: validationErrors.join('; ')
                };
            }

            const allUrls: string[] = [];
            const allFiles: VideoUploadResponse['files'] = [];
            let totalUploaded = 0;

            // Upload videos with limited parallelism
            for (let i = 0; i < validFiles.length; i += MAX_PARALLEL_UPLOADS) {
                const batch = validFiles.slice(i, i + MAX_PARALLEL_UPLOADS);

                const results = await Promise.all(
                    batch.map(async (file) => {
                        if (onProgress) {
                            onProgress({
                                uploaded: totalUploaded,
                                total: validFiles.length,
                                currentFile: file.name
                            });
                        }
                        return this.uploadSingleVideo(propertyId, file);
                    })
                );

                results.forEach(result => {
                    if (result.urls) allUrls.push(...result.urls);
                    if (result.files) allFiles.push(...result.files);
                    totalUploaded += result.filesUploaded || 0;
                });
            }

            const response: VideoUploadResponse = {
                success: true,
                filesUploaded: totalUploaded,
                urls: allUrls,
                files: allFiles
            };

            if (validationErrors.length > 0) {
                response.warnings = `Some files skipped: ${validationErrors.join('; ')}`;
            }

            return response;
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Cannot connect to video service');
            }
            throw error;
        }
    }

    /**
     * Generate a video URL for serving
     */
    static getVideoUrl(propertyId: string, filename: string): string {
        return `/api/videos/${propertyId}/${filename}`;
    }

    /**
     * Extract property ID and filename from a video path
     */
    static extractPropertyIdAndFilename(videoPath: string): { propertyId: string; filename: string } | null {
        // Handle /api/videos/ format
        if (videoPath.startsWith('/api/videos/')) {
            const parts = videoPath.replace('/api/videos/', '').split('/');
            if (parts.length >= 2) {
                return {
                    propertyId: parts[0],
                    filename: parts.slice(1).join('/')
                };
            }
        }

        // Handle direct video service URLs
        if (videoPath.includes('/videos/')) {
            const parts = videoPath.split('/videos/')[1].split('/');
            if (parts.length >= 2) {
                return {
                    propertyId: parts[0],
                    filename: parts.slice(1).join('/')
                };
            }
        }

        return null;
    }

    /**
     * Delete a video file
     */
    static async deleteVideo(propertyId: string, filename: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(
                `${VIDEO_SERVICE_URL}?propertyId=${encodeURIComponent(propertyId)}&path=${encodeURIComponent(filename)}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                }
            );

            const result = await response.json();
            return {
                success: response.ok && result.success,
                error: result.error
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete video'
            };
        }
    }

    /**
     * Generate a thumbnail URL for a video
     */
    static getThumbnailUrl(propertyId: string, filename: string): string {
        const baseName = filename.replace(/\.[^/.]+$/, '');
        return `/api/videos/${propertyId}/thumbnails/${baseName}.jpg`;
    }
}
