import React from 'react';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileCheck,
  Play,
  RotateCcw,
} from 'lucide-react';
import { RenderProgress } from '../types/video';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: RenderProgress;
  onCancel: () => void;
  onReExport: () => void;
  filename: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  progress,
  onCancel,
  onReExport,
  filename,
}) => {
  if (!isOpen) return null;

  const isRendering =
    progress.status === 'preparing' ||
    progress.status === 'rendering' ||
    progress.status === 'encoding';
  const isCompleted = progress.status === 'completed';
  const isError = progress.status === 'error';

  const handleDownload = () => {
    if (progress.exportUrl) {
      const a = document.createElement('a');
      a.href = progress.exportUrl;
      a.download = filename || 'THEKINGGEMS_FINAL_VIDEO.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0f1117] border border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : isError ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
            )}
            <h2 className="font-display text-base font-bold text-neutral-100 uppercase tracking-wide">
              {isCompleted
                ? 'EXPORT COMPLETED'
                : isError
                ? 'EXPORT FAILED'
                : 'ASSEMBLING FINAL MP4'}
            </h2>
          </div>
          {!isRendering && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Ongoing Render State */}
          {isRendering && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-200">
                  {progress.stageMessage || 'Processing local media...'}
                </span>
                <span className="font-mono-numbers text-amber-400 font-bold text-sm">
                  {progress.progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-neutral-900 rounded-full h-3 overflow-hidden border border-neutral-800/80 p-0.5">
                <div
                  className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 h-full rounded-full transition-all duration-300 ease-out shadow-lg shadow-amber-500/30"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-xs text-neutral-400 space-y-1">
                <div className="flex justify-between">
                  <span>Target File:</span>
                  <span className="font-mono-numbers text-neutral-200">{filename}</span>
                </div>
                <div className="flex justify-between">
                  <span>Engine:</span>
                  <span className="text-emerald-400 font-medium">Local Browser WASM / Compositor</span>
                </div>
                <div className="flex justify-between">
                  <span>Privacy:</span>
                  <span className="text-neutral-300">100% In-Memory (Zero Network Latency)</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg border border-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel Export
                </button>
              </div>
            </div>
          )}

          {/* Completed State */}
          {isCompleted && (
            <div className="space-y-5">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-neutral-100">
                  YOUR VIDEO IS READY!
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Successfully combined all clips and images into ONE final MP4 video.
                </p>
              </div>

              {/* Playable Video Preview */}
              {progress.exportUrl && (
                <div className="relative aspect-video rounded-xl bg-black overflow-hidden border border-neutral-800 shadow-inner">
                  <video
                    src={progress.exportUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <span className="text-neutral-400 block mb-0.5">File Size</span>
                  <span className="font-mono-numbers font-bold text-neutral-200 text-sm">
                    {progress.exportSizeFormatted || 'Ready'}
                  </span>
                </div>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <span className="text-neutral-400 block mb-0.5">Total Duration</span>
                  <span className="font-mono-numbers font-bold text-amber-400 text-sm">
                    {progress.exportDurationFormatted || '00:00'}
                  </span>
                </div>
              </div>

              {/* Primary Download Button */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm shadow-xl shadow-amber-500/25 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>DOWNLOAD {filename.toUpperCase()}</span>
                </button>

                <div className="flex justify-between items-center px-1">
                  <button
                    onClick={onReExport}
                    className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-render with different settings</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs space-y-1">
                <p className="font-semibold text-red-400">Export Error Encountered</p>
                <p>{progress.errorMessage || 'Video format not supported. Please convert the file to MP4.'}</p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={onReExport}
                  className="px-4 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg transition-colors cursor-pointer"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
