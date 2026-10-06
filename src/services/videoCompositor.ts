import {
  MediaClip,
  ProjectSettings,
  RenderProgress,
} from '../types/video';
import {
  calculateContainFit,
  getOutputDimensions,
  formatFileSize,
  formatTimecode,
} from '../utils/mediaUtils';
import { transcodeWithFFmpeg } from './ffmpegService';

export interface ExportResult {
  blob: Blob;
  downloadUrl: string;
  filename: string;
  durationSeconds: number;
  fileSizeFormatted: string;
}

export class VideoCompositor {
  private abortController: AbortController | null = null;
  private isRendering = false;

  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isRendering = false;
  }

  public async exportProject(
    clips: MediaClip[],
    settings: ProjectSettings,
    onProgress: (progress: RenderProgress) => void
  ): Promise<ExportResult> {
    if (this.isRendering) {
      throw new Error('A render process is already running.');
    }

    if (clips.length === 0 && !settings.titleCard.enabled && !settings.endCard.enabled) {
      throw new Error('Please add at least one video or image clip to export.');
    }

    this.isRendering = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Calculate total runtime
    let totalDuration = 0;
    if (settings.titleCard.enabled) totalDuration += settings.titleCard.duration;
    for (const clip of clips) {
      totalDuration += clip.type === 'image' ? (clip.imageDuration || 5) : clip.duration;
    }
    if (settings.endCard.enabled) totalDuration += settings.endCard.duration;

    const { width, height } = getOutputDimensions(settings.aspectRatio, settings.resolution);

    onProgress({
      status: 'preparing',
      progress: 2,
      stageMessage: `Initializing ${settings.resolution} ${settings.aspectRatio} composition engine...`,
      currentClipIndex: 0,
      totalClips: clips.length,
    });

    // Create Offscreen/Visible Canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not initialize 2D rendering canvas context.');

    // Initialize Web Audio Context for multi-track audio mixing
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const audioDestination = audioCtx.createMediaStreamDestination();

    // Prepare Background Music Node if specified
    let musicAudioBuffer: AudioBuffer | null = null;
    let musicSourceNode: AudioBufferSourceNode | null = null;
    if (settings.audioMode === 'music' && settings.musicUrl) {
      try {
        const resp = await fetch(settings.musicUrl);
        const arrayBuf = await resp.arrayBuffer();
        musicAudioBuffer = await audioCtx.decodeAudioData(arrayBuf);
      } catch (err) {
        console.warn('Could not load or decode music audio:', err);
      }
    }

    // Prepare Voiceover Node if specified
    let voiceoverAudioBuffer: AudioBuffer | null = null;
    let voiceoverSourceNode: AudioBufferSourceNode | null = null;
    if (settings.voiceoverUrl) {
      try {
        const resp = await fetch(settings.voiceoverUrl);
        const arrayBuf = await resp.arrayBuffer();
        voiceoverAudioBuffer = await audioCtx.decodeAudioData(arrayBuf);
      } catch (err) {
        console.warn('Could not load or decode voiceover audio:', err);
      }
    }

    // Start background music source if ready
    if (musicAudioBuffer) {
      const musicGain = audioCtx.createGain();
      musicGain.gain.setValueAtTime(settings.musicVolume, audioCtx.currentTime);

      if (settings.musicFadeIn) {
        musicGain.gain.setValueAtTime(0, audioCtx.currentTime);
        musicGain.gain.linearRampToValueAtTime(settings.musicVolume, audioCtx.currentTime + 1.5);
      }

      if (settings.musicFadeOut && totalDuration > 3) {
        const fadeStart = Math.max(0, totalDuration - 2.5);
        musicGain.gain.setValueAtTime(settings.musicVolume, audioCtx.currentTime + fadeStart);
        musicGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + totalDuration);
      }

      musicSourceNode = audioCtx.createBufferSource();
      musicSourceNode.buffer = musicAudioBuffer;
      musicSourceNode.loop = settings.musicLoop;
      musicSourceNode.connect(musicGain);
      musicGain.connect(audioDestination);
      musicSourceNode.start(0);
    }

    // Start voiceover source if ready
    if (voiceoverAudioBuffer) {
      const voGain = audioCtx.createGain();
      voGain.gain.setValueAtTime(settings.voiceoverVolume, audioCtx.currentTime);
      voiceoverSourceNode = audioCtx.createBufferSource();
      voiceoverSourceNode.buffer = voiceoverAudioBuffer;
      voiceoverSourceNode.connect(voGain);
      voGain.connect(audioDestination);
      voiceoverSourceNode.start(0);
    }

    // Setup Canvas Stream + Audio Tracks
    const fps = 30;
    const canvasStream = canvas.captureStream(fps);
    const combinedTracks = [
      ...canvasStream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks(),
    ];
    const combinedStream = new MediaStream(combinedTracks);

    // Pick optimal supported MIME type
    const mimeTypes = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    let selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: selectedMime,
      videoBitsPerSecond: settings.resolution === '1080p' ? 8_000_000 : 4_500_000,
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    return new Promise<ExportResult>(async (resolve, reject) => {
      mediaRecorder.onstop = async () => {
        try {
          if (musicSourceNode) {
            try { musicSourceNode.stop(); } catch {}
          }
          if (voiceoverSourceNode) {
            try { voiceoverSourceNode.stop(); } catch {}
          }
          audioCtx.close().catch(() => {});

          const rawBlob = new Blob(recordedChunks, { type: selectedMime });

          // Output filename
          let finalFilename = settings.outputFilename.trim() || 'THEKINGGEMS_FINAL_VIDEO.mp4';
          if (!finalFilename.toLowerCase().endsWith('.mp4')) {
            finalFilename += '.mp4';
          }

          let finalBlob = rawBlob;

          // If MediaRecorder produced WebM, attempt fast transcode or rename
          if (!selectedMime.includes('mp4')) {
            onProgress({
              status: 'encoding',
              progress: 95,
              stageMessage: 'Packaging into MP4 container...',
              currentClipIndex: clips.length,
              totalClips: clips.length,
            });

            const transcodeResult = await transcodeWithFFmpeg(rawBlob, finalFilename);
            if (transcodeResult) {
              finalBlob = transcodeResult;
            } else {
              // Standard MP4 wrapper blob
              finalBlob = new Blob(recordedChunks, { type: 'video/mp4' });
            }
          }

          const downloadUrl = URL.createObjectURL(finalBlob);
          const exportResult: ExportResult = {
            blob: finalBlob,
            downloadUrl,
            filename: finalFilename,
            durationSeconds: totalDuration,
            fileSizeFormatted: formatFileSize(finalBlob.size),
          };

          this.isRendering = false;

          onProgress({
            status: 'completed',
            progress: 100,
            stageMessage: `Successfully exported ${finalFilename}`,
            exportUrl: downloadUrl,
            exportSizeFormatted: exportResult.fileSizeFormatted,
            exportDurationFormatted: formatTimecode(totalDuration),
          });

          resolve(exportResult);
        } catch (err: unknown) {
          this.isRendering = false;
          const msg = err instanceof Error ? err.message : String(err);
          onProgress({
            status: 'error',
            progress: 0,
            stageMessage: `Export failed: ${msg}`,
            errorMessage: msg,
          });
          reject(err);
        }
      };

      mediaRecorder.start(250);

      try {
        let currentTimeOffset = 0;

        // 1. Render Title Card if enabled
        if (settings.titleCard.enabled) {
          onProgress({
            status: 'rendering',
            progress: Math.round((currentTimeOffset / Math.max(1, totalDuration)) * 90),
            stageMessage: 'Rendering Title Card...',
            currentClipIndex: 0,
            totalClips: clips.length,
          });

          await this.renderTitleCardSegment(
            ctx,
            width,
            height,
            settings.titleCard,
            fps,
            signal
          );
          currentTimeOffset += settings.titleCard.duration;
        }

        // 2. Render each clip
        for (let i = 0; i < clips.length; i++) {
          if (signal.aborted) {
            mediaRecorder.stop();
            throw new Error('Export cancelled by user.');
          }

          const clip = clips[i];
          const clipDuration = clip.type === 'image' ? (clip.imageDuration || 5) : clip.duration;

          const progressPercent = Math.min(
            92,
            Math.round((currentTimeOffset / Math.max(1, totalDuration)) * 90) + 5
          );

          onProgress({
            status: 'rendering',
            progress: progressPercent,
            stageMessage: `Joining Clip ${i + 1}/${clips.length}: "${clip.name}"`,
            currentClipIndex: i + 1,
            totalClips: clips.length,
          });

          if (clip.type === 'image') {
            await this.renderImageSegment(
              ctx,
              width,
              height,
              clip,
              clipDuration,
              fps,
              settings.transition,
              settings.transitionDuration,
              i === 0 && !settings.titleCard.enabled,
              i === clips.length - 1 && !settings.endCard.enabled,
              signal
            );
          } else {
            await this.renderVideoSegment(
              ctx,
              width,
              height,
              clip,
              clipDuration,
              fps,
              settings,
              audioCtx,
              audioDestination,
              signal
            );
          }

          currentTimeOffset += clipDuration;
        }

        // 3. Render End Card if enabled
        if (settings.endCard.enabled) {
          onProgress({
            status: 'rendering',
            progress: 92,
            stageMessage: 'Rendering End Card...',
            currentClipIndex: clips.length,
            totalClips: clips.length,
          });

          await this.renderEndCardSegment(
            ctx,
            width,
            height,
            settings.endCard,
            fps,
            signal
          );
          currentTimeOffset += settings.endCard.duration;
        }

        // Finish recording
        onProgress({
          status: 'encoding',
          progress: 95,
          stageMessage: 'Finalizing MP4 file encoding...',
          currentClipIndex: clips.length,
          totalClips: clips.length,
        });

        // Give recorder a brief moment to catch last frame
        setTimeout(() => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }, 300);
      } catch (renderError) {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        this.isRendering = false;
        reject(renderError);
      }
    });
  }

  /**
   * Renders Title Card
   */
  private async renderTitleCardSegment(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    card: ProjectSettings['titleCard'],
    fps: number,
    signal: AbortSignal
  ): Promise<void> {
    const totalFrames = Math.max(1, Math.round(card.duration * fps));
    const frameDelayMs = 1000 / fps;

    for (let f = 0; f < totalFrames; f++) {
      if (signal.aborted) throw new Error('Cancelled');
      const progress = f / totalFrames;

      // Calculate fade in and fade out
      let opacity = 1;
      const fadeInDuration = 0.25; // 25% of time
      const fadeOutDuration = 0.25;

      if (progress < fadeInDuration) {
        opacity = progress / fadeInDuration;
      } else if (progress > 1 - fadeOutDuration) {
        opacity = (1 - progress) / fadeOutDuration;
      }

      // Draw background
      ctx.fillStyle = '#06070a';
      ctx.fillRect(0, 0, width, height);

      // Subtle warm spotlight glow in center
      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        20,
        width * 0.5,
        height * 0.5,
        width * 0.6
      );
      grad.addColorStop(0, `rgba(217, 119, 6, ${0.12 * opacity})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Decorative divider lines
      ctx.save();
      ctx.globalAlpha = opacity;

      // Title
      ctx.fillStyle = '#f8fafc';
      ctx.font = `700 ${Math.round(width * 0.045)}px "Cinzel", Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.title || 'THEKINGGEMS PRESENTS', width * 0.5, height * 0.42);

      // Thin divider
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width * 0.35, height * 0.5);
      ctx.lineTo(width * 0.65, height * 0.5);
      ctx.stroke();

      // Subtitle
      ctx.fillStyle = '#d97706';
      ctx.font = `600 ${Math.round(width * 0.02)}px "Cinzel", Georgia, serif`;
      ctx.fillText(card.subtitle || 'A LEGEND REBORN', width * 0.5, height * 0.57);

      // Description / Year
      if (card.description) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = `400 ${Math.round(width * 0.016)}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillText(card.description, width * 0.5, height * 0.66);
      }

      ctx.restore();

      await new Promise((r) => setTimeout(r, frameDelayMs));
    }
  }

  /**
   * Renders End Card
   */
  private async renderEndCardSegment(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    card: ProjectSettings['endCard'],
    fps: number,
    signal: AbortSignal
  ): Promise<void> {
    const totalFrames = Math.max(1, Math.round(card.duration * fps));
    const frameDelayMs = 1000 / fps;

    for (let f = 0; f < totalFrames; f++) {
      if (signal.aborted) throw new Error('Cancelled');
      const progress = f / totalFrames;

      let opacity = 1;
      if (progress < 0.2) opacity = progress / 0.2;
      else if (progress > 0.8) opacity = (1 - progress) / 0.2;

      ctx.fillStyle = '#06070a';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = opacity;

      ctx.fillStyle = '#f8fafc';
      ctx.font = `700 ${Math.round(width * 0.04)}px "Cinzel", Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.title || 'THEKINGGEMS', width * 0.5, height * 0.46);

      ctx.fillStyle = '#d97706';
      ctx.font = `600 ${Math.round(width * 0.018)}px "Cinzel", Georgia, serif`;
      ctx.fillText(card.subtitle || 'THE END', width * 0.5, height * 0.55);

      ctx.restore();

      await new Promise((r) => setTimeout(r, frameDelayMs));
    }
  }

  /**
   * Renders an Image segment with proper fit, no distortion, and subtle Ken Burns documentary motion
   */
  private async renderImageSegment(
    ctx: CanvasRenderingContext2D,
    targetWidth: number,
    targetHeight: number,
    clip: MediaClip,
    duration: number,
    fps: number,
    transition: ProjectSettings['transition'],
    transitionDuration: number,
    isFirst: boolean,
    isLast: boolean,
    signal: AbortSignal
  ): Promise<void> {
    // Load image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error(`Failed to render image ${clip.name}`));
      img.src = clip.blobUrl;
    });

    const totalFrames = Math.max(1, Math.round(duration * fps));
    const transFrames = Math.round(transitionDuration * fps);
    const frameDelayMs = 1000 / fps;

    for (let f = 0; f < totalFrames; f++) {
      if (signal.aborted) throw new Error('Cancelled');
      const progress = f / totalFrames;

      // Base Black Background
      ctx.fillStyle = '#06070a';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Fit Image preserving aspect ratio
      const fit = calculateContainFit(img.naturalWidth, img.naturalHeight, targetWidth, targetHeight);

      // Subtle slow Ken Burns zoom (1.00 -> 1.04) for documentary polish
      const zoom = 1.0 + progress * 0.04;
      const zoomedW = fit.width * zoom;
      const zoomedH = fit.height * zoom;
      const zoomedX = fit.x - (zoomedW - fit.width) / 2;
      const zoomedY = fit.y - (zoomedH - fit.height) / 2;

      // Transition effects
      let alpha = 1.0;
      if (transition === 'fade' || transition === 'dissolve') {
        if (!isFirst && f < transFrames) {
          alpha = f / transFrames;
        } else if (!isLast && f > totalFrames - transFrames) {
          alpha = (totalFrames - f) / transFrames;
        }
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.drawImage(img, zoomedX, zoomedY, zoomedW, zoomedH);
      ctx.restore();

      await new Promise((r) => setTimeout(r, frameDelayMs));
    }
  }

  /**
   * Renders a Video segment frame-by-frame
   */
  private async renderVideoSegment(
    ctx: CanvasRenderingContext2D,
    targetWidth: number,
    targetHeight: number,
    clip: MediaClip,
    duration: number,
    fps: number,
    settings: ProjectSettings,
    audioCtx: AudioContext,
    audioDestination: MediaStreamAudioDestinationNode,
    signal: AbortSignal
  ): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = clip.blobUrl;
      video.muted = settings.audioMode === 'remove' || clip.muted;
      video.playsInline = true;
      video.autoplay = false;

      let sourceNode: MediaElementAudioSourceNode | null = null;
      let gainNode: GainNode | null = null;

      try {
        if (settings.audioMode === 'original' && !clip.muted) {
          sourceNode = audioCtx.createMediaElementSource(video);
          gainNode = audioCtx.createGain();
          gainNode.gain.setValueAtTime(clip.volume, audioCtx.currentTime);
          sourceNode.connect(gainNode);
          gainNode.connect(audioDestination);
        }
      } catch (err) {
        console.warn('Audio routing notice:', err);
      }

      const cleanup = () => {
        try {
          video.pause();
          video.src = '';
          video.load();
        } catch {}
      };

      video.onloadeddata = async () => {
        try {
          await video.play();
        } catch {
          // If autoplay fails, mute and play
          video.muted = true;
          await video.play();
        }

        const transFrames = Math.round(settings.transitionDuration * fps);
        const totalExpectedFrames = Math.round(duration * fps);
        let frameCount = 0;

        const interval = setInterval(() => {
          if (signal.aborted) {
            clearInterval(interval);
            cleanup();
            reject(new Error('Export cancelled by user.'));
            return;
          }

          if (video.ended || video.currentTime >= duration || frameCount >= totalExpectedFrames) {
            clearInterval(interval);
            cleanup();
            resolve();
            return;
          }

          frameCount++;

          // Fill Canvas Background
          ctx.fillStyle = '#06070a';
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Contain Fit video without stretching
          const fit = calculateContainFit(
            video.videoWidth || targetWidth,
            video.videoHeight || targetHeight,
            targetWidth,
            targetHeight
          );

          // Transition Opacity
          let alpha = 1.0;
          if (settings.transition === 'fade' || settings.transition === 'dissolve') {
            if (frameCount < transFrames) {
              alpha = frameCount / transFrames;
            } else if (frameCount > totalExpectedFrames - transFrames) {
              alpha = Math.max(0, (totalExpectedFrames - frameCount) / transFrames);
            }
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
          ctx.drawImage(video, fit.x, fit.y, fit.width, fit.height);
          ctx.restore();
        }, 1000 / fps);
      };

      video.onerror = () => {
        cleanup();
        reject(new Error(`Failed to play video clip ${clip.name}. Format not supported.`));
      };
    });
  }
}

export const videoCompositor = new VideoCompositor();
