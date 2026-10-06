import React, { useRef, useState } from 'react';
import {
  Video,
  Image as ImageIcon,
  Upload,
  X,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFiles: (files: FileList | File[]) => void;
  onLoadSamples: () => void;
  isLoadingSamples: boolean;
}

export const AddMediaModal: React.FC<AddMediaModalProps> = ({
  isOpen,
  onClose,
  onAddFiles,
  onLoadSamples,
  isLoadingSamples,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
      onClose();
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
      e.target.value = '';
      onClose();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
      e.target.value = '';
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#0f1117] border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Hidden inputs */}
        <input
          ref={videoInputRef}
          type="file"
          multiple
          accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
          className="hidden"
          onChange={handleVideoSelect}
        />
        <input
          ref={imageInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-500" />
            <h2 className="font-display text-base font-bold text-neutral-100 uppercase tracking-wide">
              ADD MEDIA TO TIMELINE
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Drag & Drop Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-neutral-700 bg-neutral-950/50 hover:border-neutral-600'
            }`}
          >
            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-neutral-200">
              Drag & Drop your video or image files here
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Supports MP4, MOV, WEBM, M4V, JPG, PNG, WEBP
            </p>
          </div>

          {/* Buttons: ADD VIDEO & ADD IMAGE */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/50 text-neutral-100 font-semibold text-xs transition-all cursor-pointer"
            >
              <Video className="w-4 h-4 text-amber-500" />
              <span>+ ADD VIDEO</span>
            </button>

            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-sky-500/50 text-neutral-100 font-semibold text-xs transition-all cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-sky-400" />
              <span>+ ADD IMAGE</span>
            </button>
          </div>

          {/* Quick Demo Section */}
          <div className="pt-2">
            <button
              onClick={() => {
                onLoadSamples();
                onClose();
              }}
              disabled={isLoadingSamples}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent hover:bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load 5 AI Clips Demo (Gemini Bugatti & Flow)</span>
            </button>
          </div>

          <div className="flex items-start gap-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-[11px] text-neutral-400">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              Source videos with different resolutions will be automatically normalized without distortion to your selected aspect ratio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
