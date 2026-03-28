import OpenSeadragon from 'openseadragon';
import { useEffect, useRef } from 'react';
import { mapSources } from '../types/map-sources';

export type MapViewerStatus = 'loading' | 'ready' | 'error';

interface UseMapViewerOptions {
  mapSourceKey: 'small' | 'large';
  onBeforeOpen?: () => void;
  onReady?: () => void;
  onUpdate?: () => void;
  onError?: (error: Error) => void;
  viewerRef?: React.RefObject<OpenSeadragon.Viewer | null>;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

interface UseMapViewerResult {
  viewerRef: React.RefObject<OpenSeadragon.Viewer | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const CACHE_NAME = 'destined-journey-cache-v1';
const MAP_OPEN_TIMEOUT_MS = 30000;

export const useMapViewer = ({
  mapSourceKey,
  onBeforeOpen,
  onReady,
  onUpdate,
  onError,
  viewerRef: externalViewerRef,
  containerRef: externalContainerRef,
}: UseMapViewerOptions): UseMapViewerResult => {
  const containerRef = externalContainerRef ?? useRef<HTMLDivElement | null>(null);
  const viewerRef = externalViewerRef ?? useRef<OpenSeadragon.Viewer | null>(null);

  const onBeforeOpenRef = useRef(onBeforeOpen);
  const onReadyRef = useRef(onReady);
  const onUpdateRef = useRef(onUpdate);
  const onErrorRef = useRef(onError);

  const objectUrlMapRef = useRef(new Map<'small' | 'large', string>());
  const abortRef = useRef<AbortController | null>(null);
  const openSequenceRef = useRef(0);

  useEffect(() => {
    onBeforeOpenRef.current = onBeforeOpen;
  }, [onBeforeOpen]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const viewer = OpenSeadragon({
      element: containerRef.current,
      prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
      showNavigator: true,
      showNavigationControl: true,
      showFullPageControl: true,
      visibilityRatio: 1,
      constrainDuringPan: true,
      preserveImageSizeOnResize: true,
      crossOriginPolicy: 'Anonymous',
      gestureSettingsMouse: {
        clickToZoom: false,
        dblClickToZoom: true,
        dragToPan: true,
        scrollToZoom: true,
      },
      gestureSettingsTouch: {
        pinchToZoom: true,
        dragToPan: true,
      },
    });

    viewerRef.current = viewer;

    const handleUpdate = () => {
      onUpdateRef.current?.();
    };

    viewer.addHandler('animation', handleUpdate);
    viewer.addHandler('resize', handleUpdate);
    viewer.addHandler('after-resize', handleUpdate);
    viewer.addHandler('full-page', handleUpdate);
    viewer.addHandler('open-failed', event => {
      const message = event?.message || '地图资源打开失败';
      onErrorRef.current?.(new Error(message));
    });

    const resizeObserver = new ResizeObserver(() => {
      const currentViewer = viewerRef.current;
      if (!currentViewer || currentViewer.isDestroyed()) return;

      requestAnimationFrame(() => {
        currentViewer.forceResize();
        currentViewer.viewport.applyConstraints(true);
        onUpdateRef.current?.();
      });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      viewerRef.current = null;
      viewer.destroy();
      objectUrlMapRef.current.forEach(url => URL.revokeObjectURL(url));
      objectUrlMapRef.current.clear();
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const sourceUrl = mapSources[mapSourceKey].url;
    const currentSequence = ++openSequenceRef.current;

    onBeforeOpenRef.current?.();

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let openTimeoutId = 0;
    let disposed = false;

    const ensureLatest = () => {
      return !disposed && openSequenceRef.current === currentSequence;
    };

    const notifyReady = () => {
      if (!ensureLatest()) return;

      requestAnimationFrame(() => {
        if (!ensureLatest()) return;

        viewer.forceResize();
        viewer.viewport.applyConstraints(true);
        onUpdateRef.current?.();
        onReadyRef.current?.();
      });
    };

    const waitForVisibleReady = (openedViewer: OpenSeadragon.Viewer) => {
      const tiledImage = openedViewer.world.getItemAt(0);
      if (!tiledImage) {
        notifyReady();
        return;
      }

      if (typeof tiledImage.whenFullyLoaded === 'function') {
        tiledImage.whenFullyLoaded(() => {
          notifyReady();
        });
        return;
      }

      // 兼容兜底：如果没有 whenFullyLoaded，就至少等到下一绘制帧
      const handleTileDrawn = () => {
        openedViewer.removeHandler('tile-drawn', handleTileDrawn);
        notifyReady();
      };

      openedViewer.addHandler('tile-drawn', handleTileDrawn);
    };

    const attachOpenHandler = () => {
      const handleOpen = () => {
        viewer.removeHandler('open', handleOpen);
        if (!ensureLatest()) return;
        waitForVisibleReady(viewer);
      };

      viewer.addHandler('open', handleOpen);
    };

    const openFromObjectUrl = (objectUrl: string) => {
      attachOpenHandler();
      viewer.open({
        tileSource: new OpenSeadragon.ImageTileSource({
          url: objectUrl,
        }),
      });
    };

    const openFromCache = async () => {
      try {
        openTimeoutId = window.setTimeout(() => {
          controller.abort();
          onErrorRef.current?.(new Error('地图加载超时，请稍后重试'));
        }, MAP_OPEN_TIMEOUT_MS);

        const cachedObjectUrl = objectUrlMapRef.current.get(mapSourceKey);
        if (cachedObjectUrl) {
          openFromObjectUrl(cachedObjectUrl);
          return;
        }

        let response: Response | undefined;
        if ('caches' in window) {
          const cache = await caches.open(CACHE_NAME);
          response = await cache.match(sourceUrl);
        }

        if (!response) {
          response = await fetch(sourceUrl, {
            mode: 'cors',
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          if ('caches' in window) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(sourceUrl, response.clone());
          }
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        objectUrlMapRef.current.set(mapSourceKey, objectUrl);

        if (!ensureLatest()) return;
        openFromObjectUrl(objectUrl);
      } catch (error) {
        if (controller.signal.aborted || !ensureLatest()) return;
        const normalizedError = error instanceof Error ? error : new Error('地图加载失败');
        console.error('[MapViewer] 地图加载失败:', normalizedError);
        onErrorRef.current?.(normalizedError);
      } finally {
        window.clearTimeout(openTimeoutId);
      }
    };

    openFromCache();

    return () => {
      disposed = true;
      window.clearTimeout(openTimeoutId);
      controller.abort();
    };
  }, [mapSourceKey]);

  return { viewerRef, containerRef };
};
