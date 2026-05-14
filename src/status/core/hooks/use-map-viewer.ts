import OpenSeadragon from 'openseadragon';
import { useEffect, useRef } from 'react';
import { mapSources } from '../types/map-sources';

interface UseMapViewerOptions {
  mapSourceKey: 'small' | 'large';
  onOpen?: () => void;
  onUpdate?: () => void;
  onBeforeOpen?: () => void;
  viewerRef?: React.RefObject<OpenSeadragon.Viewer | null>;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

interface UseMapViewerResult {
  viewerRef: React.RefObject<OpenSeadragon.Viewer | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const CACHE_NAME = 'destined-journey-cache-v1';

export const useMapViewer = ({
  mapSourceKey,
  onOpen,
  onUpdate,
  onBeforeOpen,
  viewerRef: externalViewerRef,
  containerRef: externalContainerRef,
}: UseMapViewerOptions): UseMapViewerResult => {
  const containerRef = externalContainerRef ?? useRef<HTMLDivElement | null>(null);
  const viewerRef = externalViewerRef ?? useRef<OpenSeadragon.Viewer | null>(null);
  const onOpenRef = useRef(onOpen);
  const onUpdateRef = useRef(onUpdate);
  const onBeforeOpenRef = useRef(onBeforeOpen);
  const objectUrlMapRef = useRef(new Map<'small' | 'large', string>());
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onBeforeOpenRef.current = onBeforeOpen;
  }, [onBeforeOpen]);

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
    viewer.addHandler('full-page', handleUpdate);

    return () => {
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
    onBeforeOpenRef.current?.();

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const openFromCache = async () => {
      try {
        const cachedObjectUrl = objectUrlMapRef.current.get(mapSourceKey);
        if (cachedObjectUrl) {
          const handleOpen = () => {
            onOpenRef.current?.();
            viewer.removeHandler('open', handleOpen);
          };
          viewer.addHandler('open', handleOpen);
          viewer.open({
            tileSource: new OpenSeadragon.ImageTileSource({
              url: cachedObjectUrl,
            }),
          });
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

        const handleOpen = () => {
          onOpenRef.current?.();
          viewer.removeHandler('open', handleOpen);
        };
        viewer.addHandler('open', handleOpen);
        viewer.open({
          tileSource: new OpenSeadragon.ImageTileSource({
            url: objectUrl,
          }),
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('[MapViewer] 地图加载失败:', error);
      }
    };

    openFromCache();

    return () => {
      controller.abort();
    };
  }, [mapSourceKey]);

  return { viewerRef, containerRef };
};
