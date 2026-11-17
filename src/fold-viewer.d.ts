export type ViewerTheme = 'wallpaper' | 'launcher';
export type ScreenName = 'inner' | 'outer' | 'both';
export type ScreenInput = string | Blob | HTMLImageElement | HTMLCanvasElement | ImageBitmap;

export interface FoldToOptions {
  duration?: number;
}

export interface ScreenImageOptions {
  screen?: ScreenName;
  open?: boolean;
}

export interface ScreenImageSources {
  inner?: ScreenInput | null;
  outer?: ScreenInput | null;
}

export interface FoldViewerOptions {
  container: HTMLElement;
  assetsBase?: string;
  modelUrl?: string;
  initialTheme?: ViewerTheme;
  initialAngle?: number;
  initialImages?: ScreenImageSources;
  autoPlay?: boolean;
  respectReducedMotion?: boolean;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onAngleChange?: (angle: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  onThemeChange?: (theme: string) => void;
  onFoldEnd?: (angle: number) => void;
}

export interface FoldViewer {
  ready: Promise<void>;
  play(): void;
  pause(): void;
  toggle(): void;
  setAngle(value: number): void;
  foldTo(value: number, options?: FoldToOptions): Promise<number>;
  getAngle(): number;
  isPlaying(): boolean;
  isReady(): boolean;
  getTheme(): string;
  setTheme(name: ViewerTheme): void;
  setScreenImage(source: ScreenInput, options?: ScreenImageOptions): Promise<void>;
  setScreenImages(sources: ScreenImageSources, options?: { open?: boolean }): Promise<void>;
  clearScreenImages(screen?: ScreenName): Promise<void>;
  setCustomImage(file: File | Blob): Promise<void>;
  resize(): void;
  dispose(): void;
}

export declare const SUPPORTED_THEMES: ViewerTheme[];

export declare function createFoldViewer(options: FoldViewerOptions): FoldViewer;
