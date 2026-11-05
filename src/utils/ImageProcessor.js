import { STORY_CONFIG } from '../constants/storyConfig.js';

/**
 * ImageProcessor Utility: Client-side validation, Canvas resizing, and Base64 optimization
 */
export const ImageProcessor = {
  /**
   * Validates selected image file against size and MIME constraints.
   * @param {File} file
   * @returns {{ valid: boolean, error?: string }}
   */
  validateFile(file) {
    if (!file) {
      return { valid: false, error: 'No file selected.' };
    }

    // Check MIME type
    const isValidType = STORY_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase());
    if (!isValidType) {
      return {
        valid: false,
        error: 'Unsupported image format. Please select a JPEG, PNG, or WebP file.'
      };
    }

    // Check raw file size limit
    const maxBytes = STORY_CONFIG.MAX_RAW_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        valid: false,
        error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Limit is ${STORY_CONFIG.MAX_RAW_FILE_SIZE_MB}MB.`
      };
    }

    return { valid: true };
  },

  /**
   * Reads an image file, calculates aspect-preserving bounding box (max 1080x1920),
   * renders to an offscreen Canvas, and converts to an optimized Base64 JPEG string.
   * @param {File} file
   * @returns {Promise<{ base64: string, width: number, height: number, dominantColor: string }>}
   */
  processImage(file) {
    return new Promise((resolve, reject) => {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return reject(new Error(validation.error));
      }

      const reader = new FileReader();

      reader.onerror = () => reject(new Error('Failed to read file from your device.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to decode image data.'));
        img.onload = () => {
          try {
            const origW = img.naturalWidth || img.width;
            const origH = img.naturalHeight || img.height;

            if (!origW || !origH) {
              return reject(new Error('Invalid image dimensions.'));
            }

            // Calculate scale factor clamping within MAX_WIDTH and MAX_HEIGHT
            const scale = Math.min(
              1.0,
              STORY_CONFIG.MAX_WIDTH / origW,
              STORY_CONFIG.MAX_HEIGHT / origH
            );

            const targetW = Math.max(1, Math.round(origW * scale));
            const targetH = Math.max(1, Math.round(origH * scale));

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
              return reject(new Error('Canvas 2D context is not available.'));
            }

            // High-quality rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.drawImage(img, 0, 0, targetW, targetH);

            // Extract dominant color from corners/center sample
            let dominantColor = '#1F3FB0';
            try {
              const sample = ctx.getImageData(Math.floor(targetW / 2), Math.floor(targetH / 2), 1, 1).data;
              dominantColor = `rgb(${sample[0]}, ${sample[1]}, ${sample[2]})`;
            } catch {
              // fallback
            }

            // Export to JPEG base64
            const base64 = canvas.toDataURL(STORY_CONFIG.IMAGE_MIME_TYPE, STORY_CONFIG.IMAGE_QUALITY);

            // Free canvas memory
            canvas.width = 0;
            canvas.height = 0;

            resolve({
              base64,
              width: targetW,
              height: targetH,
              dominantColor
            });
          } catch (err) {
            reject(new Error(`Image processing failed: ${err.message}`));
          }
        };

        img.src = reader.result;
      };

      reader.readAsDataURL(file);
    });
  }
};

