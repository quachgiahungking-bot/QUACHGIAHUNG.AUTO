import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Film,
  Layers,
} from 'lucide-react';
import { MediaClip, ProjectSettings } from '../types/video';
import { formatTimecode } from '../utils/mediaUtils';

interface PreviewPlayerProps {
  clips: MediaClip[];
  activeClip: MediaClip | null;
  settings: ProjectSettings;
  previewMode: 'timeline' | 'single';
  onTogglePreviewMode: (mode: 'timeline' | 'single') => void;
  onSelectClip: (clip: MediaClip) => void;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  clips,
  activeClip,
  settings,
  previewMode,
  onTogglePreviewMode,
  onSelectClip,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceoverAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimelineTime, setCurrentTimelineTime] = useState(0);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);

  // Compute total duration of entire timeline
  const titleDuration = settings.titleCard.enabled ? settings.titleCard.duration : 0;
  const endDuration = settings.endCard.enabled ? settings.endCard.duration : 0;

  const totalDuration =
    titleDuration +
    clips.reduce((acc, c) => acc + (c.type === 'image' ? (c.imageDuration || 5) : c.duration), 0) +
    endDuration;

  // Sync background music & voiceover
  useEffect(() => {
    if (settings.musicUrl && !musicAudioRef.current) {
      const audio = new Audio(settings.musicUrl);
      audio.loop = settings.musicLoop;
      audio.volume = settings.musicVolume;
      musicAudioRef.current = audio;
    } else if (!settings.musicUrl && musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current = null;
    }
  }, [settings.musicUrl, settings.musicLoop, settings.musicVolume]);

  useEffect(() => {
    if (settings.voiceoverUrl && !voiceoverAudioRef.current) {
      const audio = new Audio(settings.voiceoverUrl);
      audio.volume = settings.voiceoverVolume;
      voiceoverAudioRef.current = audio;
    } else if (!settings.voiceoverUrl && voiceoverAudioRef.current) {
      voiceoverAudioRef.current.pause();
      voiceoverAudioRef.current = null;
    }
  }, [settings.voiceoverUrl, settings.voiceoverVolume]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  };

  const startPlayback = () => {
    setIsPlaying(true);
    if (videoRef.current && currentClip?.type === 'video') {
      videoRef.current.play().catch(() => {});
    }
    if (musicAudioRef.current && settings.audioMode === 'music') {
      musicAudioRef.current.currentTime = currentTimelineTime % (musicAudioRef.current.duration || 1);
      musicAudioRef.current.play().catch(() => {});
    }
    if (voiceoverAudioRef.current) {
      voiceoverAudioRef.current.currentTime = currentTimelineTime;
      voiceoverAudioRef.current.play().catch(() => {});
    }
  };

  const pausePlayback = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
    }
    if (voiceoverAudioRef.current) {
      voiceoverAudioRef.current.pause();
    }
  };

  // Determine active clip in timeline preview
  const currentClip =
    previewMode === 'single'
      ? activeClip || clips[0] || null
      : clips[currentClipIndex] || null;

  // Single clip mode vs Timeline mode
  const currentDuration =
    previewMode === 'single'
      ? currentClip
        ? currentClip.type === 'image'
          ? (currentClip.imageDuration || 5)
          : currentClip.duration
        : 1
      : Math.max(totalDuration, 1);

  // Playback timer ticker for image clips & timeline
  useEffect(() => {
    let animFrame: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        if (previewMode === 'timeline') {
          setCurrentTimelineTime((prev) => {
            const next = prev + delta;
            if (next >= totalDuration) {
              pausePlayback();
              return 0;
            }
            return next;
          });

          // Check if current clip is an image
          if (currentClip && currentClip.type === 'image') {
            const imgDur = currentClip.imageDuration || 5;
            setImageProgress((p) => {
              const nextP = p + delta / imgDur;
              if (nextP >= 1) {
                // Move to next clip in timeline
                if (currentClipIndex < clips.length - 1) {
                  setCurrentClipIndex((c) => c + 1);
                } else {
                  pausePlayback();
                }
                return 0;
              }
              return nextP;
            });
          }
        }
      }
      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, previewMode, totalDuration, currentClip, currentClipIndex, clips.length]);

  // Video element time update
  const handleVideoTimeUpdate = () => {
    if (videoRef.current && currentClip?.type === 'video') {
      if (previewMode === 'single') {
        setCurrentTimelineTime(videoRef.current.currentTime);
      }
    }
  };

  const handleVideoEnded = () => {
    if (previewMode === 'timeline') {
      if (currentClipIndex < clips.length - 1) {
        const nextIndex = currentClipIndex + 1;
        setCurrentClipIndex(nextIndex);
        setImageProgress(0);
        const nextClip = clips[nextIndex];
        if (nextClip) {
          onSelectClip(nextClip);
        }
      } else {
        pausePlayback();
        setCurrentTimelineTime(0);
        setCurrentClipIndex(0);
      }
    } else {
      setIsPlaying(false);
    }
  };

  // Keyboard shortcut for spacebar Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Calculate aspect ratio container styles
  const getAspectClass = () => {
    switch (settings.aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[580px]';
      case '1:1':
        return 'aspect-square max-h-[580px]';
      case '16:9':
      default:
        return 'aspect-video max-h-[540px]';
    }
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTimelineTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime % (videoRef.current.duration || 1);
    }
  };

  const handleNextClip = () => {
    if (currentClipIndex < clips.length - 1) {
      const nextIndex = currentClipIndex + 1;
      setCurrentClipIndex(nextIndex);
      setImageProgress(0);
      onSelectClip(clips[nextIndex]);
    }
  };

  const handlePrevClip = () => {
    if (currentClipIndex > 0) {
      const prevIndex = currentClipIndex - 1;
      setCurrentClipIndex(prevIndex);
      setImageProgress(0);
      onSelectClip(clips[prevIndex]);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col bg-[#08090c] border-b border-neutral-800/80 p-4 min-w-0"
    >
      {/* Player Top Bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => onTogglePreviewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
                previewMode === 'timeline'
                  ? 'bg-amber-500 text-neutral-950 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>TIMELINE PREVIEW</span>
            </button>
            <button
              onClick={() => onTogglePreviewMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
                previewMode === 'single'
                  ? 'bg-amber-500 text-neutral-950 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>ACTIVE CLIP</span>
            </button>
          </div>

          {currentClip && (
            <span className="text-xs text-neutral-400 truncate max-w-[280px] hidden md:inline-block">
              {currentClip.name}
            </span>
          )}
        </div>

        {/* Resolution / FPS Indicator */}
        <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono-numbers">
          <span className="bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            {settings.aspectRatio} · {settings.resolution} · 30fps
          </span>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="flex-1 flex items-center justify-center bg-[#050608] rounded-2xl border border-neutral-800/80 relative overflow-hidden shadow-2xl p-2 min-h-[340px]">
        {/* Aspect Ratio Bounded Screen */}
        <div
          className={`relative ${getAspectClass()} w-full max-w-full rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-lg border border-neutral-800/50`}
        >
          {clips.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-6 text-neutral-400">
              <Film className="w-12 h-12 mb-3 text-neutral-400 stroke-[1.2]" />
              <p className="font-display text-base text-neutral-300">NO MEDIA LOADED</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                Click "+ ADD VIDEO" or drag AI clips onto the app to start assembling
              </p>
            </div>
          ) : currentClip?.type === 'image' ? (
            /* Image Clip View */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={currentClip.blobUrl}
                alt={currentClip.name}
                className="w-full h-full object-contain"
              />
              {/* Subtle documentary zoom simulation */}
              <div className="absolute bottom-3 left-3 bg-neutral-950/80 backdrop-blur-md px-2.5 py-1 rounded border border-neutral-800 text-[11px] text-neutral-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Image Slide ({currentClip.imageDuration || 5}s)</span>
              </div>
            </div>
          ) : (
            /* Video Clip View */
            <video
              ref={videoRef}
              src={currentClip?.blobUrl}
              className="w-full h-full object-contain"
              playsInline
              muted={isMuted || settings.audioMode === 'remove' || currentClip?.muted}
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
            />
          )}

          {/* Floating Clip Badge in Player */}
          {currentClip && (
            <div className="absolute top-3 left-3 bg-neutral-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-800/80 flex items-center gap-2 pointer-events-none">
              <span className="font-mono-numbers text-xs font-bold text-amber-400">
                0{currentClipIndex + 1}
              </span>
              <span className="text-neutral-600">|</span>
              <span className="text-xs font-medium text-neutral-200 truncate max-w-[200px]">
                {currentClip.name}
              </span>
              {currentClip.sourceLabel && (
                <span className="text-[10px] text-amber-500 font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                  {currentClip.sourceLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Control Bar & Timeline Scrubber */}
      <div className="mt-3 bg-[#0d0f14] rounded-xl border border-neutral-800/80 p-3">
        {/* Scrubber slider */}
        <div className="flex items-center gap-3 mb-2">
          <input
            type="range"
            min={0}
            max={currentDuration}
            step={0.05}
            value={currentTimelineTime}
            onChange={handleScrubberChange}
            aria-label="Timeline scrubber"
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          {/* Left: Transport buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevClip}
              disabled={currentClipIndex === 0}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
              title="Previous Clip"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-neutral-950 stroke-[2.5]" />
              ) : (
                <Play className="w-4 h-4 fill-neutral-950 stroke-[2.5] ml-0.5" />
              )}
            </button>

            <button
              onClick={handleNextClip}
              disabled={currentClipIndex >= clips.length - 1}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
              title="Next Clip"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Timecode */}
            <div className="ml-3 font-mono-numbers text-xs text-neutral-300">
              <span className="font-semibold text-amber-400">
                {formatTimecode(currentTimelineTime)}
              </span>
              <span className="text-neutral-600 mx-1">/</span>
              <span className="text-neutral-400">{formatTimecode(currentDuration)}</span>
            </div>
          </div>

          {/* Right: Audio & Screen Controls */}
          <div className="flex items-center gap-3">
            {/* Audio mode indicator */}
            <span className="text-[11px] text-neutral-400 hidden sm:inline-block">
              Audio:{' '}
              <strong className="text-neutral-300 capitalize">
                {settings.audioMode === 'original'
                  ? 'Original Clips'
                  : settings.audioMode === 'remove'
                  ? 'Muted'
                  : 'Custom Music'}
              </strong>
            </span>

            {/* Mute button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Volume slider */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              aria-label="Volume level"
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                setIsMuted(val === 0);
                if (videoRef.current) videoRef.current.volume = val;
              }}
              className="w-16 h-1 bg-neutral-800 rounded appearance-none cursor-pointer hidden sm:block"
            />

            {/* Fullscreen */}
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  containerRef.current?.requestFullscreen?.();
                } else {
                  document.exitFullscreen?.();
                }
              }}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
