import { AspectRatio, Resolution } from '../types/video';

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs.toString().padStart(2, '0')}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}

export function formatTimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function getOutputDimensions(aspectRatio: AspectRatio, resolution: Resolution): { width: number; height: number } {
  const is1080 = resolution === '1080p';

  switch (aspectRatio) {
    case '16:9':
      return is1080 ? { width: 1920, height: 1080 } : { width: 1280, height: 720 };
    case '9:16':
      return is1080 ? { width: 1080, height: 1920 } : { width: 720, height: 1280 };
    case '1:1':
      return is1080 ? { width: 1080, height: 1080 } : { width: 720, height: 720 };
  }
}

/**
 * Calculates 'contain' bounding box so image/video preserves aspect ratio without stretching
 */
export function calculateContainFit(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
): { x: number; y: number; width: number; height: number } {
  if (!srcWidth || !srcHeight) {
    return { x: 0, y: 0, width: targetWidth, height: targetHeight };
  }
  const srcRatio = srcWidth / srcHeight;
  const targetRatio = targetWidth / targetHeight;

  let width: number;
  let height: number;

  if (srcRatio > targetRatio) {
    width = targetWidth;
    height = targetWidth / srcRatio;
  } else {
    height = targetHeight;
    width = targetHeight * srcRatio;
  }

  const x = (targetWidth - width) / 2;
  const y = (targetHeight - height) / 2;

  return { x, y, width, height };
}

export async function extractVideoMetadata(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
  thumbnailUrl: string;
  blobUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = blobUrl;

    let hasLoadedMetadata = false;

    const timeoutId = setTimeout(() => {
      if (!hasLoadedMetadata) {
        // Fallback for tricky formats
        resolve({
          duration: 5,
          width: 1920,
          height: 1080,
          thumbnailUrl: generatePlaceholderThumbnail(file.name, 'video'),
          blobUrl,
        });
      }
    }, 8000);

    video.onloadedmetadata = () => {
      hasLoadedMetadata = true;
      const duration = video.duration || 5;
      const width = video.videoWidth || 1920;
      const height = video.videoHeight || 1080;

      // Seek to 1s or 25% to capture an informative thumbnail
      const seekTime = Math.min(1.0, duration * 0.25);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      clearTimeout(timeoutId);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f1117';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const fit = calculateContainFit(video.videoWidth, video.videoHeight, canvas.width, canvas.height);
          ctx.drawImage(video, fit.x, fit.y, fit.width, fit.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve({
            duration: video.duration || 5,
            width: video.videoWidth || 1920,
            height: video.videoHeight || 1080,
            thumbnailUrl,
            blobUrl,
          });
          return;
        }
      } catch {
        // In case of any canvas security error
      }
      resolve({
        duration: video.duration || 5,
        width: video.videoWidth || 1920,
        height: video.videoHeight || 1080,
        thumbnailUrl: generatePlaceholderThumbnail(file.name, 'video'),
        blobUrl,
      });
    };

    video.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to load video "${file.name}". Format may not be supported by browser.`));
    };
  });
}

export async function extractImageMetadata(file: File): Promise<{
  width: number;
  height: number;
  thumbnailUrl: string;
  blobUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth || 1920;
      const height = img.naturalHeight || 1080;

      // Create compact thumbnail
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f1117';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const fit = calculateContainFit(width, height, canvas.width, canvas.height);
        ctx.drawImage(img, fit.x, fit.y, fit.width, fit.height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({
          width,
          height,
          thumbnailUrl,
          blobUrl,
        });
      } else {
        resolve({
          width,
          height,
          thumbnailUrl: blobUrl,
          blobUrl,
        });
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image "${file.name}". File might be corrupted.`));
    };

    img.src = blobUrl;
  });
}

function generatePlaceholderThumbnail(name: string, type: 'video' | 'image'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#161922';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4f566b';
    ctx.font = '14px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(type.toUpperCase() + ' CLIP', 160, 80);
    ctx.fillStyle = '#8e96aa';
    ctx.font = '11px monospace';
    ctx.fillText(name.slice(0, 24), 160, 110);
  }
  return canvas.toDataURL('image/jpeg', 0.7);
}
