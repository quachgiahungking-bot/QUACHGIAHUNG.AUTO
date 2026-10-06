import React, { useRef, useState } from 'react';
import {
  Video,
  Image as ImageIcon,
  Upload,
  Trash2,
  Play,
  Clock,
  Sparkles,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { MediaClip } from '../types/video';
import { formatTimecode } from '../utils/mediaUtils';

interface MediaLibraryProps {
  clips: MediaClip[];
  activeClipId: string | null;
  onSelectClip: (clip: MediaClip) => void;
  onAddFiles: (files: FileList | File[]) => void;
  onDeleteClip: (id: string) => void;
  onClearAll: () => void;
  onLoadSamples: () => void;
  isLoadingSamples: boolean;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  clips,
  activeClipId,
  onSelectClip,
  onAddFiles,
  onDeleteClip,
  onClearAll,
  onLoadSamples,
  isLoadingSamples,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const handleVideoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <aside className="w-full lg:w-80 flex flex-col bg-[#0d0f14] border-r border-neutral-800/80 p-4 h-full shrink-0">
      {/* Hidden file inputs */}
      <input
        ref={videoInputRef}
        type="file"
        multiple
        accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
        className="hidden"
        onChange={handleVideoInputChange}
      />
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={handleImageInputChange}
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800/60 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wider text-neutral-200 uppercase">
            IMPORT MEDIA
          </span>
          <span className="text-[11px] font-mono-numbers text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
            {clips.length}
          </span>
        </div>
        {clips.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-[11px] text-neutral-400 hover:text-red-400 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Action Buttons: ADD VIDEO & ADD IMAGE */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => videoInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 transition-all text-neutral-200 hover:text-white group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-md bg-amber-500/10 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Video className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-xs font-bold tracking-wide">+ ADD VIDEO</span>
          <span className="text-[10px] text-neutral-400">MP4, MOV, WEBM</span>
        </button>

        <button
          onClick={() => imageInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 transition-all text-neutral-200 hover:text-white group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-md bg-sky-500/10 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ImageIcon className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-xs font-bold tracking-wide">+ ADD IMAGE</span>
          <span className="text-[10px] text-neutral-400">JPG, PNG, WEBP</span>
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => videoInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all mb-3 ${
          isDragging
            ? 'border-amber-500 bg-amber-500/10'
            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/40 hover:bg-neutral-900/30'
        }`}
      >
        <Upload className="w-6 h-6 mx-auto mb-2 text-neutral-400" />
        <p className="text-xs font-medium text-neutral-300">
          Drag & drop AI video clips or images
        </p>
        <p className="text-[10px] text-neutral-400 mt-1">
          Select multiple clips from your computer
        </p>
      </div>

      {/* 5-Segment AI Demo Button */}
      <div className="mb-3">
        <button
          onClick={onLoadSamples}
          disabled={isLoadingSamples}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-gradient-to-r from-amber-950/30 via-neutral-900 to-amber-950/20 hover:from-amber-950/50 hover:to-neutral-900 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {isLoadingSamples
              ? 'Generating 5 Documentary Clips...'
              : 'Try Example: 5 Car AI Clips'}
          </span>
        </button>
      </div>

      {/* Media Clip List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-[160px]">
        {clips.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-neutral-400">
            <Cpu className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs font-medium text-neutral-400">No media clips imported</p>
            <p className="text-[11px] text-neutral-400 mt-1 max-w-[200px]">
              Add your Gemini or Flow video clips to assemble your documentary video
            </p>
          </div>
        ) : (
          clips.map((clip, idx) => {
            const isSelected = clip.id === activeClipId;
            const clipDur =
              clip.type === 'image' ? clip.imageDuration || 5 : clip.duration;

            return (
              <div
                key={clip.id}
                onClick={() => onSelectClip(clip)}
                className={`group flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-800/90 border-amber-500/60 shadow-sm'
                    : 'bg-neutral-900/60 hover:bg-neutral-800/50 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                {/* Number index */}
                <span className="font-mono-numbers text-[11px] font-semibold text-neutral-400 w-4 text-center">
                  {(idx + 1).toString().padStart(2, '0')}
                </span>

                {/* Thumbnail */}
                <div className="relative w-12 h-8 rounded bg-neutral-950 overflow-hidden shrink-0 border border-neutral-800">
                  <img
                    src={clip.thumbnailUrl}
                    alt={clip.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                      <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-200 truncate">
                    {clip.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5">
                    <span className="uppercase font-semibold text-neutral-400">
                      {clip.type}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5 font-mono-numbers">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTimecode(clipDur)}
                    </span>
                    {clip.sourceLabel && (
                      <>
                        <span>·</span>
                        <span className="text-amber-500/90">{clip.sourceLabel}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClip(clip.id);
                  }}
                  title="Remove clip"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Local Processing Guarantee footer badge */}
      <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-start gap-2 text-neutral-400">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-tight">
          <span className="font-semibold text-neutral-300">100% Local Processing</span>
          <p className="text-neutral-400 text-[10px] mt-0.5">
            Videos stay on your computer. Zero server uploads.
          </p>
        </div>
      </div>
    </aside>
  );
};
