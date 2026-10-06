import React, { useRef } from 'react';
import {
  Sliders,
  Volume2,
  Music,
  Mic,
  Type,
  FileVideo,
  X,
  Sparkles,
} from 'lucide-react';
import {
  AspectRatio,
  Resolution,
  TransitionType,
  TransitionDuration,
  AudioMode,
  ProjectSettings,
} from '../types/video';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProjectSettings;
  onUpdateSettings: (newSettings: Partial<ProjectSettings>) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const musicInputRef = useRef<HTMLInputElement>(null);
  const voiceoverInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      onUpdateSettings({
        musicFile: file,
        musicUrl: url,
        musicName: file.name,
        audioMode: 'music',
      });
    }
  };

  const handleVoiceoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      onUpdateSettings({
        voiceoverFile: file,
        voiceoverUrl: url,
        voiceoverName: file.name,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f1118] border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-500" />
            <h2 className="font-display text-base font-bold text-neutral-100 uppercase tracking-wide">
              PROJECT & EXPORT SETTINGS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Format & Resolution */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wider">
              <FileVideo className="w-4 h-4 text-amber-500" />
              <span>OUTPUT FORMAT & RATIO</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-medium">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ar) => (
                    <button
                      key={ar}
                      onClick={() => onUpdateSettings({ aspectRatio: ar })}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        settings.aspectRatio === ar
                          ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                          : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {ar === '16:9' ? '16:9 Land' : ar === '9:16' ? '9:16 Port' : '1:1 Square'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-medium">
                  Resolution
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['1080p', '720p'] as Resolution[]).map((res) => (
                    <button
                      key={res}
                      onClick={() => onUpdateSettings({ resolution: res })}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        settings.resolution === res
                          ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                          : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {res} {res === '1080p' ? '(Full HD)' : '(Fast)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filename */}
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5 font-medium">
                Export Filename
              </label>
              <input
                type="text"
                value={settings.outputFilename}
                onChange={(e) => onUpdateSettings({ outputFilename: e.target.value })}
                placeholder="THEKINGGEMS_FINAL_VIDEO.mp4"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/80 font-mono-numbers"
              />
            </div>
          </section>

          {/* 2. Transitions */}
          <section className="space-y-3 pt-4 border-t border-neutral-800/80">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>VIDEO TRANSITIONS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-medium">
                  Transition Effect
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['none', 'fade', 'dissolve'] as TransitionType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => onUpdateSettings({ transition: t })}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold uppercase border transition-all ${
                        settings.transition === t
                          ? 'bg-amber-500 text-neutral-950 border-amber-400'
                          : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-medium">
                  Transition Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([0.3, 0.5, 1.0] as TransitionDuration[]).map((dur) => (
                    <button
                      key={dur}
                      onClick={() => onUpdateSettings({ transitionDuration: dur })}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        settings.transitionDuration === dur
                          ? 'bg-amber-500 text-neutral-950 border-amber-400'
                          : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 3. Audio Options */}
          <section className="space-y-3 pt-4 border-t border-neutral-800/80">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wider">
              <Volume2 className="w-4 h-4 text-amber-500" />
              <span>AUDIO CONFIGURATION</span>
            </div>

            {/* Audio Modes: A, B, C */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onUpdateSettings({ audioMode: 'original' })}
                className={`p-3 rounded-lg text-left border transition-all ${
                  settings.audioMode === 'original'
                    ? 'bg-neutral-800 border-amber-500 text-neutral-100 shadow-sm'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <span className="block text-xs font-bold mb-0.5">A. Original Audio</span>
                <span className="block text-[10px] text-neutral-400">Keep clip sound</span>
              </button>

              <button
                onClick={() => onUpdateSettings({ audioMode: 'remove' })}
                className={`p-3 rounded-lg text-left border transition-all ${
                  settings.audioMode === 'remove'
                    ? 'bg-neutral-800 border-amber-500 text-neutral-100 shadow-sm'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <span className="block text-xs font-bold mb-0.5">B. Remove Audio</span>
                <span className="block text-[10px] text-neutral-400">Mute all source videos</span>
              </button>

              <button
                onClick={() => onUpdateSettings({ audioMode: 'music' })}
                className={`p-3 rounded-lg text-left border transition-all ${
                  settings.audioMode === 'music'
                    ? 'bg-neutral-800 border-amber-500 text-neutral-100 shadow-sm'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <span className="block text-xs font-bold mb-0.5">C. Add Music File</span>
                <span className="block text-[10px] text-neutral-400">Custom MP3 / WAV</span>
              </button>
            </div>

            {/* Music File Details */}
            {settings.audioMode === 'music' && (
              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-3">
                <input
                  ref={musicInputRef}
                  type="file"
                  accept="audio/mp3,audio/wav,audio/mpeg"
                  className="hidden"
                  onChange={handleMusicUpload}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-medium text-neutral-200 truncate max-w-[280px]">
                      {settings.musicName || 'No music file selected'}
                    </span>
                  </div>
                  <button
                    onClick={() => musicInputRef.current?.click()}
                    className="text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20"
                  >
                    {settings.musicName ? 'Change Music' : 'Upload MP3 / WAV'}
                  </button>
                </div>

                {/* Volume Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                    <span>Music Volume</span>
                    <span className="font-mono-numbers text-amber-400">
                      {Math.round(settings.musicVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.musicVolume}
                    aria-label="Music volume"
                    onChange={(e) =>
                      onUpdateSettings({ musicVolume: parseFloat(e.target.value) })
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer"
                  />
                </div>

                {/* Music Options: Loop, Fade In, Fade Out */}
                <div className="flex flex-wrap gap-4 text-xs text-neutral-300 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.musicLoop}
                      onChange={(e) => onUpdateSettings({ musicLoop: e.target.checked })}
                      className="rounded bg-neutral-800 border-neutral-700 text-amber-500"
                    />
                    <span>Loop to video duration</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.musicFadeIn}
                      onChange={(e) => onUpdateSettings({ musicFadeIn: e.target.checked })}
                      className="rounded bg-neutral-800 border-neutral-700 text-amber-500"
                    />
                    <span>Fade In</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.musicFadeOut}
                      onChange={(e) => onUpdateSettings({ musicFadeOut: e.target.checked })}
                      className="rounded bg-neutral-800 border-neutral-700 text-amber-500"
                    />
                    <span>Fade Out</span>
                  </label>
                </div>
              </div>
            )}

            {/* Voiceover Option */}
            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-3">
              <input
                ref={voiceoverInputRef}
                type="file"
                accept="audio/mp3,audio/wav,audio/mpeg"
                className="hidden"
                onChange={handleVoiceoverUpload}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-semibold text-neutral-200">
                    VOICEOVER / NARRATION (OPTIONAL)
                  </span>
                </div>
                <button
                  onClick={() => voiceoverInputRef.current?.click()}
                  className="text-xs font-medium text-sky-400 hover:text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded border border-sky-500/20"
                >
                  {settings.voiceoverName ? 'Change Narration' : '+ Add Voiceover MP3/WAV'}
                </button>
              </div>

              {settings.voiceoverName && (
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                    <span>Voiceover Volume</span>
                    <span className="font-mono-numbers text-sky-400">
                      {Math.round(settings.voiceoverVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.voiceoverVolume}
                    aria-label="Voiceover volume"
                    onChange={(e) =>
                      onUpdateSettings({ voiceoverVolume: parseFloat(e.target.value) })
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>
          </section>

          {/* 4. Title Card & End Card */}
          <section className="space-y-4 pt-4 border-t border-neutral-800/80">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wider">
              <Type className="w-4 h-4 text-amber-500" />
              <span>CINEMATIC TITLE & END CARDS</span>
            </div>

            {/* Title Card */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.titleCard.enabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        titleCard: { ...settings.titleCard, enabled: e.target.checked },
                      })
                    }
                    className="rounded bg-neutral-800 border-neutral-700 text-amber-500"
                  />
                  <span>Add Opening Title Card</span>
                </label>
                {settings.titleCard.enabled && (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <span>Duration:</span>
                    <select
                      value={settings.titleCard.duration}
                      aria-label="Opening title card duration"
                      onChange={(e) =>
                        onUpdateSettings({
                          titleCard: {
                            ...settings.titleCard,
                            duration: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="bg-neutral-900 text-amber-400 text-xs px-2 py-0.5 rounded border border-neutral-700"
                    >
                      <option value={3}>3 sec</option>
                      <option value={4}>4 sec</option>
                      <option value={5}>5 sec</option>
                      <option value={6}>6 sec</option>
                      <option value={8}>8 sec</option>
                    </select>
                  </div>
                )}
              </div>

              {settings.titleCard.enabled && (
                <div className="space-y-2 pt-2 border-t border-neutral-800/50">
                  <input
                    type="text"
                    value={settings.titleCard.title}
                    onChange={(e) =>
                      onUpdateSettings({
                        titleCard: { ...settings.titleCard, title: e.target.value },
                      })
                    }
                    placeholder="TITLE (e.g. BUGATTI TYPE 46 – LA PETITE ROYALE)"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 font-display"
                  />
                  <input
                    type="text"
                    value={settings.titleCard.subtitle}
                    onChange={(e) =>
                      onUpdateSettings({
                        titleCard: { ...settings.titleCard, subtitle: e.target.value },
                      })
                    }
                    placeholder="SUBTITLE (e.g. THE REBIRTH OF A LEGEND)"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200"
                  />
                  <input
                    type="text"
                    value={settings.titleCard.description}
                    onChange={(e) =>
                      onUpdateSettings({
                        titleCard: { ...settings.titleCard, description: e.target.value },
                      })
                    }
                    placeholder="DESCRIPTION (e.g. 1930 → 2026)"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200"
                  />
                </div>
              )}
            </div>

            {/* End Card */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.endCard.enabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        endCard: { ...settings.endCard, enabled: e.target.checked },
                      })
                    }
                    className="rounded bg-neutral-800 border-neutral-700 text-amber-500"
                  />
                  <span>Add Closing End Card</span>
                </label>
                {settings.endCard.enabled && (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <span>Duration:</span>
                    <select
                      value={settings.endCard.duration}
                      aria-label="Closing end card duration"
                      onChange={(e) =>
                        onUpdateSettings({
                          endCard: {
                            ...settings.endCard,
                            duration: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="bg-neutral-900 text-amber-400 text-xs px-2 py-0.5 rounded border border-neutral-700"
                    >
                      <option value={3}>3 sec</option>
                      <option value={4}>4 sec</option>
                      <option value={5}>5 sec</option>
                      <option value={6}>6 sec</option>
                    </select>
                  </div>
                )}
              </div>

              {settings.endCard.enabled && (
                <div className="space-y-2 pt-2 border-t border-neutral-800/50">
                  <input
                    type="text"
                    value={settings.endCard.title}
                    onChange={(e) =>
                      onUpdateSettings({
                        endCard: { ...settings.endCard, title: e.target.value },
                      })
                    }
                    placeholder="TITLE (e.g. THEKINGGEMS)"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 font-display"
                  />
                  <input
                    type="text"
                    value={settings.endCard.subtitle}
                    onChange={(e) =>
                      onUpdateSettings({
                        endCard: { ...settings.endCard, subtitle: e.target.value },
                      })
                    }
                    placeholder="SUBTITLE (e.g. A LEGEND REBORN)"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200"
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/10 cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
