import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let isLoaded = false;
let loadPromise: Promise<boolean> | null = null;

/**
 * Checks if the browser supports SharedArrayBuffer, which FFmpeg.wasm multi-threading requires.
 */
export function isSharedArrayBufferSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.SharedArrayBuffer !== 'undefined' && window.crossOriginIsolated;
}

/**
 * Initializes FFmpeg instance if possible
 */
export async function initFFmpeg(onLog?: (message: string) => void): Promise<boolean> {
  if (isLoaded && ffmpegInstance) return true;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const ffmpeg = new FFmpeg();

      ffmpeg.on('log', ({ message }) => {
        onLog?.(message);
      });

      // Try loading FFmpeg
      await ffmpeg.load();
      ffmpegInstance = ffmpeg;
      isLoaded = true;
      return true;
    } catch (err) {
      console.warn('FFmpeg.wasm loading note (will use browser native media engine):', err);
      isLoaded = false;
      return false;
    }
  })();

  return loadPromise;
}

/**
 * Transcodes a webm/mp4 blob into standard H.264/AAC MP4 using FFmpeg if available
 */
export async function transcodeWithFFmpeg(
  inputBlob: Blob,
  outputFilename: string,
  onProgress?: (progress: number) => void
): Promise<Blob | null> {
  const ready = await initFFmpeg();
  if (!ready || !ffmpegInstance) {
    return null;
  }

  try {
    const inputExt = inputBlob.type.includes('mp4') ? 'in.mp4' : 'in.webm';
    const outputName = outputFilename.endsWith('.mp4') ? outputFilename : `${outputFilename}.mp4`;

    ffmpegInstance.on('progress', ({ progress }) => {
      onProgress?.(Math.round(progress * 100));
    });

    const fileData = await fetchFile(inputBlob);
    await ffmpegInstance.writeFile(inputExt, fileData);

    // Fast H.264 + AAC encode
    await ffmpegInstance.exec([
      '-i',
      inputExt,
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-crf',
      '22',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-movflags',
      '+faststart',
      outputName,
    ]);

    const data = await ffmpegInstance.readFile(outputName);
    await ffmpegInstance.deleteFile(inputExt);
    await ffmpegInstance.deleteFile(outputName);

    const rawBytes = data instanceof Uint8Array ? data : new Uint8Array(data as unknown as ArrayBuffer);
    // Copy into a standard ArrayBuffer to avoid SharedArrayBuffer type incompatibility
    const standardBuffer = new Uint8Array(rawBytes).slice().buffer;
    return new Blob([standardBuffer], { type: 'video/mp4' });
  } catch (err) {
    console.error('FFmpeg transcode error:', err);
    return null;
  }
}
