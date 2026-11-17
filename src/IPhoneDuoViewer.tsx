'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { CSSProperties } from 'react';
import { createFoldViewer, SUPPORTED_THEMES } from './fold-viewer.js';
import type {
  FoldViewer,
  ScreenImageOptions,
  ScreenImageSources,
  ScreenInput,
  ScreenName,
  ViewerTheme,
} from './fold-viewer.js';
import './IPhoneDuoViewer.css';

const DEFAULT_LABELS = {
  closed: 'Closed',
  open: 'Open',
  foldState: 'Fold state',
  loading: 'Loading preview…',
  loadError: 'Unable to load the preview.',
  retry: 'Try again',
  imageError: 'Unable to use this image.',
  viewport: 'iPhone Duo fold preview. Drag to rotate, scroll to zoom.',
};

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
  setScreenImage(source: ScreenInput, options?: ScreenImageOptions): Promise<void> | undefined;
  setScreenImages(
    sources: ScreenImageSources,
    options?: { open?: boolean },
  ): Promise<void> | undefined;
  resize(): void;
  getViewer(): FoldViewer | null;
}

const ClosedIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="7.5" y="2.5" width="9" height="19" rx="2.5" />
  </svg>
);

const OpenIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="2.5" y="5" width="8.6" height="14" rx="2" />
    <rect x="13.4" y="5" width="8.6" height="14" rx="2" />
  </svg>
);

/**
 * Foldable iPhone preview with a Closed / Open segmented control.
 *
 * The engine lives in `fold-viewer.js` and owns the WebGL canvas; this
 * component only renders the controls around it.
 */
const IPhoneDuoViewer = forwardRef<IPhoneDuoViewerHandle, IPhoneDuoViewerProps>(
  function IPhoneDuoViewer(
    {
      assetsBase = './assets',
      modelUrl,
      open: openProp,
      defaultOpen = true,
      duration = 1.4,
      theme = 'wallpaper',
      image = null,
      closedImage = null,
      openImage = null,
      labels,
      className = '',
      style,
      onReady,
      onError,
      onOpenChange,
      onFoldEnd,
    },
    ref,
  ) {
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const viewerRef = useRef<FoldViewer | null>(null);

    const [openState, setOpenState] = useState(Boolean(defaultOpen));
    const controlled = openProp !== undefined;
    const isOpen = controlled ? Boolean(openProp) : openState;

    const [ready, setReady] = useState(false);
    const [loadError, setLoadError] = useState<Error | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);

    const text = { ...DEFAULT_LABELS, ...labels };
    const callbacksRef = useRef({ onReady, onError, onOpenChange, onFoldEnd });
    const textRef = useRef(text);
    const stateRef = useRef({ isOpen, controlled, duration });
    callbacksRef.current = { onReady, onError, onOpenChange, onFoldEnd };
    textRef.current = text;
    stateRef.current = { isOpen, controlled, duration };

    const initialRef = useRef<{ open: boolean; theme: ViewerTheme }>({
      open: openProp === undefined ? Boolean(defaultOpen) : Boolean(openProp),
      theme: SUPPORTED_THEMES.includes(theme) ? theme : 'wallpaper',
    });

    // Specific screens win over `image`; null falls back to the default theme.
    const innerSource = openImage ?? image;
    const outerSource = closedImage ?? image;

    useEffect(() => {
      const container = viewportRef.current;
      if (!container) return undefined;
      setReady(false);
      setLoadError(null);
      setImageError(null);
      let cancelled = false;
      let viewer: FoldViewer;
      try {
        viewer = createFoldViewer({
          container,
          assetsBase,
          modelUrl,
          initialTheme: initialRef.current.theme,
          initialAngle: initialRef.current.open ? 180 : 0,
          initialImages: innerSource || outerSource
            ? { inner: innerSource, outer: outerSource }
            : undefined,
          onReady() {
            if (cancelled) return;
            setReady(true);
            callbacksRef.current.onReady?.();
          },
          onError(error) {
            if (cancelled) return;
            setLoadError(error || new Error(DEFAULT_LABELS.loadError));
            callbacksRef.current.onError?.(error);
          },
          onFoldEnd(angle) {
            if (!cancelled) callbacksRef.current.onFoldEnd?.(angle);
          },
        });
      } catch (error) {
        const failure = error instanceof Error ? error : new Error(String(error));
        setLoadError(failure);
        callbacksRef.current.onError?.(failure);
        return undefined;
      }
      viewerRef.current = viewer;
      return () => {
        cancelled = true;
        viewerRef.current = null;
        viewer.dispose();
      };
      // Artwork is applied by the effect below; only the mount options belong here.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assetsBase, modelUrl, reloadToken]);

    useEffect(() => {
      if (!ready) return;
      viewerRef.current?.foldTo(isOpen ? 180 : 0, { duration });
    }, [ready, isOpen, duration]);

    useEffect(() => {
      if (!ready || !SUPPORTED_THEMES.includes(theme)) return;
      try {
        viewerRef.current?.setTheme(theme);
      } catch (error) {
        callbacksRef.current.onError?.(error as Error);
      }
    }, [ready, theme]);

    useEffect(() => {
      if (!ready) return;
      const viewer = viewerRef.current;
      if (!viewer) return;
      setImageError(null);
      if (!innerSource && !outerSource) {
        viewer.clearScreenImages().catch(error => callbacksRef.current.onError?.(error as Error));
        return;
      }
      viewer.setScreenImages({ inner: innerSource, outer: outerSource }).catch(error => {
        setImageError(textRef.current.imageError);
        callbacksRef.current.onError?.(error as Error);
      });
    }, [ready, innerSource, outerSource]);

    const setOpen = useCallback((next: boolean, { animate = true }: FoldOptions = {}) => {
      const value = Boolean(next);
      const viewer = viewerRef.current;
      if (!viewer || !viewer.isReady() || value === stateRef.current.isOpen) {
        return Promise.resolve(viewer?.getAngle() ?? 0);
      }
      if (!stateRef.current.controlled) setOpenState(value);
      callbacksRef.current.onOpenChange?.(value);
      if (!animate) {
        viewer.setAngle(value ? 180 : 0);
        return Promise.resolve(viewer.getAngle());
      }
      return viewer.foldTo(value ? 180 : 0, { duration: stateRef.current.duration });
    }, []);

    useImperativeHandle(ref, () => ({
      open: options => setOpen(true, options),
      close: options => setOpen(false, options),
      toggle: options => setOpen(!stateRef.current.isOpen, options),
      setOpen,
      setAngle: value => viewerRef.current?.setAngle(value),
      getAngle: () => viewerRef.current?.getAngle() ?? 0,
      setTheme: (name: ViewerTheme) => viewerRef.current?.setTheme(name),
      setImage: source => viewerRef.current?.setScreenImage(source, { open: false }),
      setScreenImage: (source: ScreenInput, options?: ScreenImageOptions) => (
        viewerRef.current?.setScreenImage(source, options)
      ),
      setScreenImages: (sources: ScreenImageSources, options?: { open?: boolean }) => (
        viewerRef.current?.setScreenImages(sources, options)
      ),
      resize: () => viewerRef.current?.resize(),
      getViewer: () => viewerRef.current,
    }), [setOpen]);

    return (
      <div
        className={`idv${className ? ` ${className}` : ''}`}
        style={style}
        data-ready={ready ? 'true' : 'false'}
        data-open={isOpen ? 'true' : 'false'}
      >
        <div ref={viewportRef} className="idv-viewport" role="img" aria-label={text.viewport} />

        {!ready && !loadError && <p className="idv-status" role="status">{text.loading}</p>}

        {loadError && (
          <div className="idv-error" role="alert">
            <p>{text.loadError}</p>
            <button type="button" onClick={() => setReloadToken(token => token + 1)}>
              {text.retry}
            </button>
          </div>
        )}

        {imageError && !loadError && <p className="idv-notice" role="status">{imageError}</p>}

        <div className="idv-toggle" role="group" aria-label={text.foldState}>
          <button type="button" aria-pressed={!isOpen} disabled={!ready} onClick={() => { setOpen(false); }}>
            <ClosedIcon />
            <span>{text.closed}</span>
          </button>
          <button type="button" aria-pressed={isOpen} disabled={!ready} onClick={() => { setOpen(true); }}>
            <OpenIcon />
            <span>{text.open}</span>
          </button>
        </div>
      </div>
    );
  },
);

export default IPhoneDuoViewer;
export { SUPPORTED_THEMES, createFoldViewer };
export type { FoldViewer, ScreenInput, ScreenName, ViewerTheme };
