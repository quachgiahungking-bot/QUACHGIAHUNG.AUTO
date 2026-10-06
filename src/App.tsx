import React, { useState, useEffect, useCallback } from 'react';
import {
  MediaClip,
  ProjectSettings,
  RenderProgress,
} from './types/video';
import { Header } from './components/Header';
import { MediaLibrary } from './components/MediaLibrary';
import { PreviewPlayer } from './components/PreviewPlayer';
import { Timeline } from './components/Timeline';
import { SettingsPanel } from './components/SettingsPanel';
import { ExportModal } from './components/ExportModal';
import { AddMediaModal } from './components/AddMediaModal';
import {
  extractVideoMetadata,
  extractImageMetadata,
  formatTimecode,
} from './utils/mediaUtils';
import { generateFiveSampleClips } from './services/sampleGenerator';
import { videoCompositor } from './services/videoCompositor';
import { Sliders, Settings2 } from 'lucide-react';

const INITIAL_SETTINGS: ProjectSettings = {
  aspectRatio: '16:9',
  resolution: '1080p',
  outputFilename: 'THEKINGGEMS_FINAL_VIDEO.mp4',
  transition: 'none',
  transitionDuration: 0.5,
  audioMode: 'original',
  musicFile: null,
  musicUrl: null,
  musicName: null,
  musicVolume: 0.2,
  musicLoop: true,
  musicFadeIn: true,
  musicFadeOut: true,
  voiceoverFile: null,
  voiceoverUrl: null,
  voiceoverName: null,
  voiceoverVolume: 0.8,
  titleCard: {
    enabled: true,
    title: 'BUGATTI TYPE 46 – LA PETITE ROYALE',
    subtitle: 'THE REBIRTH OF A LEGEND',
    description: '1930 → 2026',
    duration: 4,
  },
  endCard: {
    enabled: true,
    title: 'THEKINGGEMS',
    subtitle: 'A LEGEND REBORN',
    duration: 3,
  },
};

export default function App() {
  const [clips, setClips] = useState<MediaClip[]>([]);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'timeline' | 'single'>('timeline');
  const [settings, setSettings] = useState<ProjectSettings>(INITIAL_SETTINGS);

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState(false);

  // Status
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Render & Export Progress
  const [renderProgress, setRenderProgress] = useState<RenderProgress>({
    status: 'idle',
    progress: 0,
    stageMessage: 'Ready to join clips',
  });

  // Load 5 sample AI clips automatically or on user request
  const loadSampleClips = useCallback(async () => {
    setIsLoadingSamples(true);
    setErrorMessage(null);
    try {
      const sampleClips = await generateFiveSampleClips();
      setClips(sampleClips);
      if (sampleClips.length > 0) {
        setActiveClipId(sampleClips[0].id);
      }
    } catch (err) {
      console.error('Failed to load sample clips:', err);
      setErrorMessage('Could not generate sample clips. You can upload your own MP4 videos.');
    } finally {
      setIsLoadingSamples(false);
    }
  }, []);

  // Initialize with the 5 AI Car Documentary clips on startup so user has a working pipeline immediately
  useEffect(() => {
    loadSampleClips();
  }, [loadSampleClips]);

  // Handle uploaded files (videos or images)
  const handleAddFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    setErrorMessage(null);

    const newClips: MediaClip[] = [];

    for (const file of fileArray) {
      const mime = file.type.toLowerCase();
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      const isVideo =
        mime.startsWith('video/') || ['mp4', 'mov', 'webm', 'm4v'].includes(ext);
      const isImage =
        mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext);

      if (!isVideo && !isImage) {
        setErrorMessage(
          `Video format not supported for "${file.name}". Please convert the file to MP4 or use PNG/JPG/WEBP.`
        );
        continue;
      }

      try {
        if (isVideo) {
          const meta = await extractVideoMetadata(file);
          newClips.push({
            id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            file,
            blobUrl: meta.blobUrl,
            type: 'video',
            duration: meta.duration,
            originalWidth: meta.width,
            originalHeight: meta.height,
            thumbnailUrl: meta.thumbnailUrl,
            imageDuration: 5,
            volume: 1,
            muted: false,
            sourceLabel: 'User Upload',
            fileSizeFormatted: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          });
        } else if (isImage) {
          const meta = await extractImageMetadata(file);
          newClips.push({
            id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            file,
            blobUrl: meta.blobUrl,
            type: 'image',
            duration: 5,
            originalWidth: meta.width,
            originalHeight: meta.height,
            thumbnailUrl: meta.thumbnailUrl,
            imageDuration: 5, // Default 5 seconds
            volume: 1,
            muted: true,
            sourceLabel: 'Image Slide',
            fileSizeFormatted: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          });
        }
      } catch (err: unknown) {
        const errorText = err instanceof Error ? err.message : String(err);
        setErrorMessage(
          `Video format not supported or corrupted file: ${file.name}. (${errorText})`
        );
      }
    }

    if (newClips.length > 0) {
      setClips((prev) => [...prev, ...newClips]);
      if (!activeClipId) {
        setActiveClipId(newClips[0].id);
      }
    }
  };

  // Reordering
  const handleReorderClips = (startIndex: number, endIndex: number) => {
    setClips((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(startIndex, 1);
      updated.splice(endIndex, 0, moved);
      return updated;
    });
  };

  // Delete clip
  const handleDeleteClip = (id: string) => {
    setClips((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (activeClipId === id) {
        setActiveClipId(remaining[0]?.id || null);
      }
      return remaining;
    });
  };

  // Clear all clips
  const handleClearAll = () => {
    // Revoke object URLs to free memory
    clips.forEach((c) => {
      if (c.blobUrl && !c.blobUrl.startsWith('data:')) {
        try { URL.revokeObjectURL(c.blobUrl); } catch {}
      }
    });
    setClips([]);
    setActiveClipId(null);
  };

  // Update image duration
  const handleUpdateImageDuration = (clipId: string, duration: number) => {
    setClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, imageDuration: duration } : c))
    );
  };

  // Apply Presets
  const handleApplyPreset = (presetKey: 'carDoc' | 'shortVideo' | 'square') => {
    if (presetKey === 'carDoc') {
      setSettings((s) => ({
        ...s,
        aspectRatio: '16:9',
        resolution: '1080p',
        transition: 'none',
        transitionDuration: 0.5,
        outputFilename: 'THEKINGGEMS_FINAL_VIDEO.mp4',
        titleCard: {
          enabled: true,
          title: 'BUGATTI TYPE 46 – LA PETITE ROYALE',
          subtitle: 'THE REBIRTH OF A LEGEND',
          description: '1930 → 2026',
          duration: 4,
        },
        endCard: {
          enabled: true,
          title: 'THEKINGGEMS',
          subtitle: 'A LEGEND REBORN',
          duration: 3,
        },
      }));
    } else if (presetKey === 'shortVideo') {
      setSettings((s) => ({
        ...s,
        aspectRatio: '9:16',
        resolution: '1080p',
        outputFilename: 'THEKINGGEMS_SHORT_VIDEO.mp4',
        titleCard: {
          ...s.titleCard,
          enabled: false,
        },
        endCard: {
          ...s.endCard,
          enabled: false,
        },
      }));
    } else if (presetKey === 'square') {
      setSettings((s) => ({
        ...s,
        aspectRatio: '1:1',
        resolution: '1080p',
        outputFilename: 'THEKINGGEMS_SQUARE_VIDEO.mp4',
      }));
    }
  };

  // Run Export process
  const handleStartExport = async () => {
    if (clips.length === 0 && !settings.titleCard.enabled) {
      setErrorMessage('Please add at least one video or image clip to export.');
      return;
    }

    setIsExportModalOpen(true);
    setRenderProgress({
      status: 'preparing',
      progress: 0,
      stageMessage: 'Preparing composition engine...',
      totalClips: clips.length,
    });

    try {
      await videoCompositor.exportProject(clips, settings, (p) => {
        setRenderProgress(p);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg !== 'Cancelled' && !msg.includes('cancelled')) {
        setRenderProgress({
          status: 'error',
          progress: 0,
          stageMessage: `Export failed: ${msg}`,
          errorMessage: msg,
        });
      }
    }
  };

  // Compute total duration formatted
  const titleDuration = settings.titleCard.enabled ? settings.titleCard.duration : 0;
  const endDuration = settings.endCard.enabled ? settings.endCard.duration : 0;
  const totalDurationSeconds =
    titleDuration +
    clips.reduce(
      (acc, c) => acc + (c.type === 'image' ? (c.imageDuration || 5) : c.duration),
      0
    ) +
    endDuration;

  const activeClip = clips.find((c) => c.id === activeClipId) || clips[0] || null;

  return (
    <div className="min-h-screen flex flex-col bg-[#08090c] text-neutral-100 selection:bg-amber-500 selection:text-neutral-950">
      {/* 1. Header with Top Bar Contract */}
      <Header
        clipCount={clips.length}
        totalDurationFormatted={formatTimecode(totalDurationSeconds)}
        onOpenExport={handleStartExport}
        onOpenAddMedia={() => setIsAddMediaModalOpen(true)}
        onApplyPreset={handleApplyPreset}
        onLoadSamples={loadSampleClips}
        isLoadingSamples={isLoadingSamples}
        settings={settings}
        onUpdateSettings={(newVals) => setSettings((s) => ({ ...s, ...newVals }))}
      />

      {/* Global Error Notice Bar if any */}
      {errorMessage && (
        <div className="bg-red-950/60 border-b border-red-500/40 px-4 py-2 flex items-center justify-between text-xs text-red-200">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick Settings & Preset Pill Bar */}
      <div className="bg-[#0b0d12] border-b border-neutral-800/60 px-4 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-neutral-400 uppercase tracking-wider text-[11px] font-semibold">
            Workflow:
          </span>
          <div className="flex items-center gap-1.5 text-neutral-300">
            <span className="font-mono-numbers text-amber-500 font-bold">1</span>
            <span>Import</span>
            <span className="text-neutral-600">→</span>
            <span className="font-mono-numbers text-amber-500 font-bold">2</span>
            <span>Reorder</span>
            <span className="text-neutral-600">→</span>
            <span className="font-mono-numbers text-amber-500 font-bold">3</span>
            <span>Preview</span>
            <span className="text-neutral-600">→</span>
            <span className="font-mono-numbers text-amber-500 font-bold">4</span>
            <span className="font-semibold text-amber-400">Join & Export MP4</span>
          </div>
        </div>

        {/* Settings button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>Audio, Title & Transitions</span>
          </button>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Configure Project Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Studio Workspace: Left Media Library + Center Preview Player */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Side: IMPORT MEDIA */}
        <MediaLibrary
          clips={clips}
          activeClipId={activeClipId}
          onSelectClip={(clip) => {
            setActiveClipId(clip.id);
            setPreviewMode('single');
          }}
          onAddFiles={handleAddFiles}
          onDeleteClip={handleDeleteClip}
          onClearAll={handleClearAll}
          onLoadSamples={loadSampleClips}
          isLoadingSamples={isLoadingSamples}
        />

        {/* Center: Large Video Preview Player */}
        <PreviewPlayer
          clips={clips}
          activeClip={activeClip}
          settings={settings}
          previewMode={previewMode}
          onTogglePreviewMode={setPreviewMode}
          onSelectClip={(clip) => {
            setActiveClipId(clip.id);
          }}
        />
      </main>

      {/* 3. Bottom: Timeline */}
      <Timeline
        clips={clips}
        activeClipId={activeClipId}
        settings={settings}
        onSelectClip={(clip) => {
          setActiveClipId(clip.id);
        }}
        onReorderClips={handleReorderClips}
        onDeleteClip={handleDeleteClip}
        onUpdateImageDuration={handleUpdateImageDuration}
        onOpenAddMedia={() => setIsAddMediaModalOpen(true)}
        onJoinAll={handleStartExport}
      />

      {/* Settings Modal */}
      <SettingsPanel
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={(newVals) => setSettings((s) => ({ ...s, ...newVals }))}
      />

      {/* Export & Render Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        progress={renderProgress}
        onCancel={() => {
          videoCompositor.cancel();
          setIsExportModalOpen(false);
        }}
        onReExport={handleStartExport}
        filename={settings.outputFilename}
      />

      {/* Add Media Modal */}
      <AddMediaModal
        isOpen={isAddMediaModalOpen}
        onClose={() => setIsAddMediaModalOpen(false)}
        onAddFiles={handleAddFiles}
        onLoadSamples={loadSampleClips}
        isLoadingSamples={isLoadingSamples}
      />
    </div>
  );
}
