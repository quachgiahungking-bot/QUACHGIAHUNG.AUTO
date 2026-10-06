import React, { useState } from 'react';
import {
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  Plus,
  Play,
} from 'lucide-react';
import { MediaClip, ProjectSettings } from '../types/video';
import { formatTimecode } from '../utils/mediaUtils';

interface TimelineProps {
  clips: MediaClip[];
  activeClipId: string | null;
  settings: ProjectSettings;
  onSelectClip: (clip: MediaClip) => void;
  onReorderClips: (startIndex: number, endIndex: number) => void;
  onDeleteClip: (id: string) => void;
  onUpdateImageDuration: (clipId: string, duration: number) => void;
  onOpenAddMedia: () => void;
  onJoinAll: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  clips,
  activeClipId,
  settings,
  onSelectClip,
  onReorderClips,
  onDeleteClip,
  onUpdateImageDuration,
  onOpenAddMedia,
  onJoinAll,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorderClips(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveClip = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < clips.length) {
      onReorderClips(index, targetIndex);
    }
  };

  return (
    <div className="bg-[#0b0c10] border-t border-neutral-800/80 p-4">
      {/* Timeline Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-xs font-bold tracking-wider text-neutral-200 uppercase">
              SEQUENCE TIMELINE
            </span>
            <span className="font-mono-numbers text-xs text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {clips.length} CLIPS
            </span>
          </div>

          <span className="text-neutral-600 hidden sm:inline">|</span>

          <span className="text-[11px] text-neutral-400 hidden sm:inline">
            Drag cards to reorder sequence · Click clip to preview
          </span>
        </div>

        {/* Action: JOIN ALL VIDEOS */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddMedia}
            className="flex items-center gap-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add More</span>
          </button>

          <button
            onClick={onJoinAll}
            disabled={clips.length === 0}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 py-1.5 rounded-lg shadow-md shadow-amber-500/20 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-neutral-950" />
            <span>JOIN ALL VIDEOS</span>
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Timeline Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 min-h-[148px]">
        {/* Title Card Indicator if enabled */}
        {settings.titleCard.enabled && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-40 h-28 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-amber-500/40 p-2.5 flex flex-col justify-between shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-400 tracking-wider">
                  TITLE CARD
                </span>
                <span className="text-[10px] font-mono-numbers text-neutral-400">
                  {settings.titleCard.duration}s
                </span>
              </div>
              <p className="font-display text-xs font-bold text-neutral-100 truncate">
                {settings.titleCard.title || 'BUGATTI TYPE 46'}
              </p>
              <p className="text-[10px] text-amber-500/80 truncate">
                {settings.titleCard.subtitle || 'LA PETITE ROYALE'}
              </p>
            </div>

            {/* Transition Pill */}
            <div className="flex flex-col items-center justify-center shrink-0 px-1">
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                {settings.transition}
              </span>
            </div>
          </div>
        )}

        {/* Clip Cards */}
        {clips.length === 0 ? (
          <div className="w-full h-28 rounded-xl border border-dashed border-neutral-800 flex items-center justify-center text-center p-4">
            <p className="text-xs text-neutral-400">
              Timeline is empty. Drag and drop clips or click "+ ADD MEDIA".
            </p>
          </div>
        ) : (
          clips.map((clip, index) => {
            const isSelected = clip.id === activeClipId;
            const isDraggingThis = draggedIndex === index;
            const isOverThis = dragOverIndex === index;
            const clipDur =
              clip.type === 'image' ? clip.imageDuration || 5 : clip.duration;

            return (
              <React.Fragment key={clip.id}>
                <div
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelectClip(clip)}
                  className={`relative w-52 h-28 rounded-xl shrink-0 p-2 flex flex-col justify-between border cursor-pointer select-none transition-all group ${
                    isSelected
                      ? 'bg-neutral-800/90 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-neutral-900/80 hover:bg-neutral-850 border-neutral-800 hover:border-neutral-700'
                  } ${isDraggingThis ? 'opacity-40 scale-95' : ''} ${
                    isOverThis ? 'border-amber-400 bg-amber-500/10' : ''
                  }`}
                >
                  {/* Top Bar: Index + Grip + Source + Move Arrows */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-400 cursor-grab" />
                      <span className="font-mono-numbers text-xs font-bold text-amber-400">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                    </div>

                    {clip.sourceLabel && (
                      <span className="text-[9px] font-semibold text-neutral-400 bg-neutral-950 px-1 py-0.2 rounded border border-neutral-800 truncate max-w-[70px]">
                        {clip.sourceLabel}
                      </span>
                    )}

                    {/* Move Left / Right buttons */}
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveClip(index, 'left');
                        }}
                        disabled={index === 0}
                        title="Move Left"
                        className="p-0.5 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white disabled:opacity-20"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveClip(index, 'right');
                        }}
                        disabled={index === clips.length - 1}
                        title="Move Right"
                        className="p-0.5 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white disabled:opacity-20"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClip(clip.id);
                      }}
                      title="Delete Clip"
                      className="p-0.5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Thumbnail & Filename Display (Format: 01 | Gemini_01.mp4) */}
                  <div className="flex items-center gap-2 my-1">
                    <div className="w-14 h-9 rounded bg-black overflow-hidden shrink-0 border border-neutral-800">
                      <img
                        src={clip.thumbnailUrl}
                        alt={clip.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-neutral-200 truncate" title={clip.name}>
                        {clip.name}
                      </p>
                      <span className="text-[10px] text-neutral-400 uppercase">
                        {clip.type}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Duration selector (for images: 3s, 5s, 8s, 10s) */}
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[10px]">
                    {clip.type === 'image' ? (
                      <div className="flex items-center gap-1 w-full justify-between">
                        <span className="text-neutral-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-400" />
                          Duration:
                        </span>
                        <select
                          value={clip.imageDuration || 5}
                          aria-label={`Duration for image ${clip.name}`}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            onUpdateImageDuration(clip.id, parseInt(e.target.value, 10))
                          }
                          className="bg-neutral-950 text-sky-300 text-[10px] font-mono-numbers px-1.5 py-0.5 rounded border border-neutral-700 focus:outline-none"
                        >
                          <option value={3}>3 sec</option>
                          <option value={5}>5 sec (Default)</option>
                          <option value={8}>8 sec</option>
                          <option value={10}>10 sec</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-neutral-400 flex items-center gap-1 font-mono-numbers">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          {formatTimecode(clipDur)}
                        </span>
                        <span className="text-neutral-400 font-mono-numbers text-[9px]">
                          {clip.originalWidth}x{clip.originalHeight}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transition marker between clips */}
                {index < clips.length - 1 && (
                  <div className="flex flex-col items-center justify-center shrink-0 px-0.5">
                    <span className="text-[8px] uppercase tracking-wider text-neutral-400 bg-neutral-900/80 px-1 py-0.5 rounded border border-neutral-800/70">
                      {settings.transition === 'none' ? 'CUT' : settings.transition}
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}

        {/* End Card Indicator if enabled */}
        {settings.endCard.enabled && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-center justify-center shrink-0 px-1">
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                {settings.transition}
              </span>
            </div>

            <div className="w-40 h-28 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-amber-500/40 p-2.5 flex flex-col justify-between shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-400 tracking-wider">
                  END CARD
                </span>
                <span className="text-[10px] font-mono-numbers text-neutral-400">
                  {settings.endCard.duration}s
                </span>
              </div>
              <p className="font-display text-xs font-bold text-neutral-100 truncate">
                {settings.endCard.title || 'THEKINGGEMS'}
              </p>
              <p className="text-[10px] text-amber-500/80 truncate">
                {settings.endCard.subtitle || 'A LEGEND REBORN'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
