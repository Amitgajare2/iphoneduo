import type { CSSProperties, ForwardRefExoticComponent, RefAttributes } from 'react';

export type ViewerTheme = 'wallpaper' | 'launcher';
export type ScreenInput = string | Blob | HTMLImageElement | HTMLCanvasElement | ImageBitmap;
export type ScreenName = 'inner' | 'outer' | 'both';

export interface ViewerLabels {
  closed?: string;
  open?: string;
  foldState?: string;
  loading?: string;
  loadError?: string;
  retry?: string;
  imageError?: string;
  viewport?: string;
}

export interface FoldOptions {
  animate?: boolean;
}

export interface FoldToOptions {
  duration?: number;
}

export interface FoldViewerOptions {
  container: HTMLElement;
  assetsBase?: string;
  modelUrl?: string;
  initialTheme?: ViewerTheme;
  initialAngle?: number;
  initialImages?: { inner?: ScreenInput | null; outer?: ScreenInput | null };
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
  setScreenImage(source: ScreenInput, options?: { screen?: ScreenName; open?: boolean }): Promise<void>;
  setScreenImages(
    sources: { inner?: ScreenInput | null; outer?: ScreenInput | null },
    options?: { open?: boolean },
  ): Promise<void>;
  clearScreenImages(screen?: ScreenName): Promise<void>;
  setCustomImage(file: File | Blob): Promise<void>;
  resize(): void;
  dispose(): void;
}

export declare function createFoldViewer(options: FoldViewerOptions): FoldViewer;
export declare const SUPPORTED_THEMES: ViewerTheme[];

export interface IPhoneDuoViewerProps {
  /** Folder containing `iPhone_Duo_Render.usdc` and `ui/`. */
  assetsBase?: string;
  /** Explicit model URL; overrides `assetsBase`. */
  modelUrl?: string;
  /** Controlled fold state. Pair with `onOpenChange`. */
  open?: boolean;
  /** Initial fold state when uncontrolled. */
  defaultOpen?: boolean;
  /** Fold animation length in seconds; `0` is instant. */
  duration?: number;
  /** Default layouts for screens without artwork. */
  theme?: ViewerTheme;
  /** Artwork for both screens. */
  image?: ScreenInput | null;
  /** Cover-screen artwork, seen while closed. Falls back to `image`. */
  closedImage?: ScreenInput | null;
  /** Inner-display artwork, seen while open. Falls back to `image`. */
  openImage?: ScreenInput | null;
  labels?: ViewerLabels;
  className?: string;
  style?: CSSProperties;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onOpenChange?: (open: boolean) => void;
  onFoldEnd?: (angle: number) => void;
}

export interface IPhoneDuoViewerHandle {
  open(options?: FoldOptions): Promise<number>;
  close(options?: FoldOptions): Promise<number>;
  toggle(options?: FoldOptions): Promise<number>;
  setOpen(open: boolean, options?: FoldOptions): Promise<number>;
  setAngle(value: number): void;
  getAngle(): number;
  setTheme(name: ViewerTheme): void;
  setImage(source: ScreenInput): Promise<void> | undefined;
  setScreenImage(
    source: ScreenInput,
    options?: { screen?: ScreenName; open?: boolean },
  ): Promise<void> | undefined;
  setScreenImages(
    sources: { inner?: ScreenInput | null; outer?: ScreenInput | null },
    options?: { open?: boolean },
  ): Promise<void> | undefined;
  resize(): void;
  getViewer(): FoldViewer | null;
}

export declare const IPhoneDuoViewer: ForwardRefExoticComponent<
  IPhoneDuoViewerProps & RefAttributes<IPhoneDuoViewerHandle>
>;

export default IPhoneDuoViewer;
