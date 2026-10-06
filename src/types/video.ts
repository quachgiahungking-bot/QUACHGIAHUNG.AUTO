export type MediaType = 'video' | 'image';
export type AspectRatio = '16:9' | '9:16' | '1:1';
export type Resolution = '1080p' | '720p';
export type TransitionType = 'none' | 'fade' | 'dissolve';
export type TransitionDuration = 0.3 | 0.5 | 1.0;
export type AudioMode = 'original' | 'remove' | 'music';

export interface MediaClip {
  id: string;
  name: string;
  file?: File;
  blobUrl: string;
  type: MediaType;
  duration: number; // in seconds
  originalWidth: number;
  originalHeight: number;
  thumbnailUrl: string;
  imageDuration: number; // For images: 3, 5, 8, 10
  volume: number;
  muted: boolean;
  sourceLabel?: string; // e.g. "Gemini", "Google Flow", "User Upload"
  fileSizeFormatted?: string;
}

export interface TitleCardSettings {
  enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  duration: number; // 3 to 8
}

export interface EndCardSettings {
  enabled: boolean;
  title: string;
  subtitle: string;
  duration: number; // 3 to 6
}

export interface ProjectSettings {
  aspectRatio: AspectRatio;
  resolution: Resolution;
  outputFilename: string;
  transition: TransitionType;
  transitionDuration: TransitionDuration;
  audioMode: AudioMode;
  musicFile: File | null;
  musicUrl: string | null;
  musicName: string | null;
  musicVolume: number; // 0 to 1
  musicLoop: boolean;
  musicFadeIn: boolean;
  musicFadeOut: boolean;
  voiceoverFile: File | null;
  voiceoverUrl: string | null;
  voiceoverName: string | null;
  voiceoverVolume: number; // 0 to 1
  titleCard: TitleCardSettings;
  endCard: EndCardSettings;
}

export interface RenderProgress {
  status: 'idle' | 'preparing' | 'rendering' | 'encoding' | 'completed' | 'error';
  progress: number; // 0 to 100
  stageMessage: string;
  currentFrame?: number;
  totalFrames?: number;
  currentClipIndex?: number;
  totalClips?: number;
  exportUrl?: string;
  exportSizeFormatted?: string;
  exportDurationFormatted?: string;
  errorMessage?: string;
}
