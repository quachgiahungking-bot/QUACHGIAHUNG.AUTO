import React from 'react';
import { Film, Sparkles, Download, Layers } from 'lucide-react';
import { AspectRatio, ProjectSettings } from '../types/video';

interface HeaderProps {
  clipCount: number;
  totalDurationFormatted: string;
  onOpenExport: () => void;
  onOpenAddMedia: () => void;
  onApplyPreset: (presetKey: 'carDoc' | 'shortVideo' | 'square') => void;
  onLoadSamples: () => void;
  isLoadingSamples: boolean;
  settings: ProjectSettings;
  onUpdateSettings: (newSettings: Partial<ProjectSettings>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  clipCount,
  totalDurationFormatted,
  onOpenExport,
  onOpenAddMedia,
  onApplyPreset,
  onLoadSamples,
  isLoadingSamples,
  settings,
  onUpdateSettings,
}) => {
  return (
    <header className="border-b border-neutral-800/80 bg-[#0d0f14]/90 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-6 py-2.5">
      <div className="max-w-[1680px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Film className="w-5 h-5 text-neutral-950 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-base lg:text-lg font-bold tracking-wider text-neutral-100 uppercase">
                THEKINGGEMS VIDEO JOINER
              </span>
            </div>
            <p className="text-[10px] tracking-widest text-amber-500/90 uppercase font-semibold">
              AI VIDEO ASSEMBLY STUDIO
            </p>
          </div>
        </div>

        {/* Zone 2: Project Presets & Stats */}
        <div className="flex items-center gap-3">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-900/90 border border-neutral-800 rounded-lg px-2.5 py-1">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] text-neutral-400">Preset:</span>
            <select
              aria-label="Documentary Preset"
              className="bg-transparent text-neutral-200 text-xs font-medium focus:outline-none cursor-pointer"
              onChange={(e) => onApplyPreset(e.target.value as 'carDoc' | 'shortVideo' | 'square')}
              defaultValue="carDoc"
            >
              <option value="carDoc" className="bg-[#141721] text-neutral-200">
                5-Segment Car Documentary (16:9 1080p)
              </option>
              <option value="shortVideo" className="bg-[#141721] text-neutral-200">
                Short Video (9:16 1080p)
              </option>
              <option value="square" className="bg-[#141721] text-neutral-200">
                Square Master (1:1 1080p)
              </option>
            </select>
          </div>

          {/* Load 5 Sample Clips Button */}
          <button
            onClick={onLoadSamples}
            disabled={isLoadingSamples}
            title="Load 5 AI Clips: Gemini Bugatti 1-3 & Google Flow 4-5"
            className="flex items-center gap-1.5 text-xs font-medium text-amber-400/90 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoadingSamples ? 'Generating Clips...' : 'Load 5 AI Clips Demo'}</span>
          </button>

          {/* Timeline Duration Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 font-mono-numbers px-2.5 py-1 bg-neutral-900/60 border border-neutral-800/80 rounded-lg">
            <span>{clipCount} clips</span>
            <span className="text-neutral-600">·</span>
            <span className="text-amber-400 font-semibold">{totalDurationFormatted}</span>
          </div>
        </div>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          {/* Aspect Ratio Selector Quick Switch */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs font-medium">
            {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ar) => (
              <button
                key={ar}
                onClick={() => onUpdateSettings({ aspectRatio: ar })}
                className={`px-2.5 py-1 rounded transition-colors ${
                  settings.aspectRatio === ar
                    ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {ar}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenAddMedia}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-100 transition-colors"
          >
            <span>+ ADD MEDIA</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>EXPORT MP4</span>
          </button>
        </div>
      </div>
    </header>
  );
};
