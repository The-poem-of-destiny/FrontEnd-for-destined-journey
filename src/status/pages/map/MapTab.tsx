import _ from 'lodash';
import OpenSeadragon from 'openseadragon';
import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DrawStroke, useCanvasDraw } from '../../core/hooks/use-canvas-draw';
import { useMapMarkers } from '../../core/hooks/use-map-markers';
import { useMapViewer } from '../../core/hooks/use-map-viewer';
import { MapMarker } from '../../core/types/map-markers';
import { mapSourceList } from '../../core/types/map-source-list';
import { DEFAULT_DRAW_COLOR } from '../../core/utils/map-constants';
import { MapStage, MapToolbar, MarkerWorkbench } from './components/map-tab-sections';
import styles from './MapTab.module.scss';

export const MapTab: FC = () => {
  const [drawMode, setDrawMode] = useState(false);
  const [drawStrokes, setDrawStrokes] = useState<DrawStroke[]>([]);
  const [drawColor, setDrawColor] = useState(DEFAULT_DRAW_COLOR);
  const [mapSourceKey, setMapSourceKey] = useState<'small' | 'large'>('small');
  const [markerSearch, setMarkerSearch] = useState('');
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isMarkerPanelVisible, setIsMarkerPanelVisible] = useState(false);
  const [activeMarkerCardPosition, setActiveMarkerCardPosition] = useState<{
    left: number;
    top: number;
    visible: boolean;
  }>({
    left: 0,
    top: 0,
    visible: false,
  });
  const [markerCardSize, setMarkerCardSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [editingName, setEditingName] = useState('');
  const [editingGroup, setEditingGroup] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingImageUrls, setEditingImageUrls] = useState<string[]>([]);
  const inlineContainerRef = useRef<HTMLDivElement | null>(null);
  const inlineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const markerCardRef = useRef<HTMLElement | null>(null);
  const viewerRef = useRef<OpenSeadragon.Viewer | null>(null);
  const redrawRef = useRef<() => void>(() => undefined);
  const getViewerOverlayHost = useCallback(() => {
    const viewer = viewerRef.current;
    return viewer?.element ?? inlineContainerRef.current;
  }, []);
  const resizeCanvasRef = useRef<() => void>(() => undefined);
  const prevMarkerCountRef = useRef<number>(0);
  const pendingViewportBoundsRef = useRef<OpenSeadragon.Rect | null>(null);

  const markerClassNames = useMemo(
    () => ({
      mapMarker: styles.mapMarker,
      mapMarkerActive: styles.mapMarkerActive,
      mapMarkerDrawMode: styles.mapMarkerDrawMode,
      mapMarkerIcon: styles.mapMarkerIcon,
      mapMarkerIconNode: styles.mapMarkerIconNode,
      mapMarkerLabel: styles.mapMarkerLabel,
    }),
    [],
  );

  const {
    markers: mapMarkers,
    setMarkers: setMapMarkers,
    activeMarkerId,
    setActiveMarkerId,
    markerAddMode,
    setMarkerAddMode,
    updateMarker: updateMarkerBase,
    deleteMarker,
    addMarkerAt,
    focusMarker,
    syncMarkerOverlaysRef,
    updateSingleMarkerRef,
    overlayMapRef,
  } = useMapMarkers({
    viewerRef,
    classNames: markerClassNames,
    drawMode,
  });

  const updateMarker = useCallback(
    (id: string, patch: Partial<MapMarker>) => {
      updateMarkerBase(id, patch);
    },
    [updateMarkerBase],
  );

  const flushMarkerUpdate = useCallback(
    (id: string) => {
      requestAnimationFrame(() => {
        updateSingleMarkerRef.current(id);
      });
    },
    [updateSingleMarkerRef],
  );

  const activeMarker = useMemo(() => {
    return mapMarkers.find(marker => marker.id === activeMarkerId) ?? null;
  }, [mapMarkers, activeMarkerId]);

  useEffect(() => {
    if (activeMarker) {
      setEditingName(activeMarker.name);
      setEditingGroup(activeMarker.group ?? '');
      setEditingDescription(activeMarker.description ?? '');
      setEditingImageUrls(activeMarker.imageUrls ?? []);
    }
    // 切换标记时重置卡片尺寸缓存，确保 markerCardReady 重新走测量流程
    setMarkerCardSize(null);
  }, [activeMarkerId]);

  const filteredMarkers = useMemo(() => {
    const keyword = markerSearch.trim().toLowerCase();
    if (!keyword) return mapMarkers;
    return mapMarkers.filter(marker => {
      return [marker.name, marker.group, marker.description]
        .filter(Boolean)
        .some(text => text!.toLowerCase().includes(keyword));
    });
  }, [mapMarkers, markerSearch]);

  const syncActiveMarkerCardPosition = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || !activeMarker || drawMode) {
      setActiveMarkerCardPosition(prev =>
        prev.visible
          ? {
              ...prev,
              visible: false,
            }
          : prev,
      );
      return;
    }

    const imageItem = viewer.world.getItemAt(0);
    if (!imageItem) {
      setActiveMarkerCardPosition(prev =>
        prev.visible
          ? {
              ...prev,
              visible: false,
            }
          : prev,
      );
      return;
    }

    const size = imageItem.getContentSize();
    const container = getViewerOverlayHost();
    if (!size.x || !size.y || !container) {
      setActiveMarkerCardPosition(prev =>
        prev.visible
          ? {
              ...prev,
              visible: false,
            }
          : prev,
      );
      return;
    }

    const imagePoint = new OpenSeadragon.Point(
      activeMarker.position.nx * size.x,
      activeMarker.position.ny * size.y,
    );
    const viewerPoint = viewer.viewport.imageToViewerElementCoordinates(imagePoint);
    const containerRect = container.getBoundingClientRect();
    const horizontalPadding = 12;
    const topPadding = 12;
    const bottomPadding = 18;
    const pointerGap = 18;
    const fallbackCardWidth = window.innerWidth <= 768 ? 240 : 320;
    const fallbackCardHeight = window.innerWidth <= 768 ? 220 : 280;
    const cardWidth = markerCardSize?.width ?? fallbackCardWidth;
    const cardHeight = markerCardSize?.height ?? fallbackCardHeight;
    const minLeft = horizontalPadding + cardWidth / 2;
    const maxLeft = containerRect.width - horizontalPadding - cardWidth / 2;
    const nextLeft =
      minLeft <= maxLeft ? _.clamp(viewerPoint.x, minLeft, maxLeft) : containerRect.width / 2;

    let nextTop = viewerPoint.y - pointerGap;
    const cardTop = nextTop - cardHeight;
    if (cardTop < topPadding) {
      nextTop = cardHeight + topPadding;
    }

    const maxTop = containerRect.height - bottomPadding;
    if (nextTop > maxTop) {
      nextTop = maxTop;
    }

    setActiveMarkerCardPosition({
      left: nextLeft,
      top: nextTop,
      visible: true,
    });
  }, [activeMarker, drawMode, getViewerOverlayHost, markerCardSize]);

  const mapPointFromEvent = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
      const viewer = viewerRef.current;
      if (!viewer) return null;
      const imageItem = viewer.world.getItemAt(0);
      if (!imageItem) return null;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      const viewerPoint = new OpenSeadragon.Point(
        event.clientX - rect.left,
        event.clientY - rect.top,
      );
      const imagePoint = viewer.viewport.viewerElementToImageCoordinates(viewerPoint);
      const size = imageItem.getContentSize();
      if (!size.x || !size.y) return null;
      return {
        nx: imagePoint.x / size.x,
        ny: imagePoint.y / size.y,
      };
    },
    [],
  );

  const mapPointToCanvas = useCallback(
    (point: { nx: number; ny: number }, canvas: HTMLCanvasElement) => {
      const viewer = viewerRef.current;
      if (!viewer) return null;
      const imageItem = viewer.world.getItemAt(0);
      if (!imageItem) return null;
      const size = imageItem.getContentSize();
      if (!size.x || !size.y) return null;
      const imagePoint = new OpenSeadragon.Point(point.nx * size.x, point.ny * size.y);
      const viewerPoint = viewer.viewport.imageToViewerElementCoordinates(imagePoint);
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      return { x: viewerPoint.x, y: viewerPoint.y };
    },
    [],
  );

  const inlineDraw = useCanvasDraw({
    enabled: drawMode,
    containerRef: inlineContainerRef,
    canvasRef: inlineCanvasRef,
    initialStrokes: drawStrokes,
    onChange: setDrawStrokes,
    strokeColor: drawColor,
    mapPointFromEvent,
    mapPointToCanvas,
  });

  const { resizeCanvas, redraw } = inlineDraw;

  useEffect(() => {
    redrawRef.current = redraw;
  }, [redraw]);

  useEffect(() => {
    resizeCanvasRef.current = resizeCanvas;
  }, [resizeCanvas]);

  useEffect(() => {
    try {
      const variables = getVariables({ type: 'character' });
      const savedStrokes = _.get(variables, 'map_drawings', []);
      if (Array.isArray(savedStrokes)) {
        setDrawStrokes(savedStrokes as DrawStroke[]);
      }
      const savedMarkers = _.get(variables, 'map_markers', []);
      if (Array.isArray(savedMarkers)) {
        setMapMarkers(savedMarkers as MapMarker[]);
      }
    } catch (error) {
      console.error('[StatusMap] 读取地图涂画/标记失败:', error);
    }
  }, [setMapMarkers]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        insertOrAssignVariables({ map_drawings: drawStrokes }, { type: 'character' });
      } catch (error) {
        console.error('[StatusMap] 保存地图涂画失败:', error);
      }
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [drawStrokes]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        insertOrAssignVariables({ map_markers: mapMarkers }, { type: 'character' });
      } catch (error) {
        console.error('[StatusMap] 保存地图标记失败:', error);
      }
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [mapMarkers]);

  useLayoutEffect(() => {
    if (!activeMarker || drawMode) return;

    let raf = 0;
    let ro: ResizeObserver | null = null;

    const update = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      setMarkerCardSize({ width: rect.width, height: rect.height });
    };

    const tryObserve = () => {
      const el = markerCardRef.current;
      if (!el) {
        // Portal 的 ref 尚未挂载，等下一帧重试
        raf = requestAnimationFrame(tryObserve);
        return;
      }
      update(el);
      ro = new ResizeObserver(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => update(el));
      });
      ro.observe(el);
    };

    tryObserve();

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [activeMarker?.id, drawMode]);

  useMapViewer({
    mapSourceKey,
    viewerRef,
    containerRef: inlineContainerRef,
    onOpen: () => {
      setIsMapLoading(false);
      resizeCanvasRef.current();
      redrawRef.current();
      syncMarkerOverlaysRef.current();
      syncActiveMarkerCardPosition();
    },
    onUpdate: () => {
      redrawRef.current();
      syncActiveMarkerCardPosition();
    },
    onBeforeOpen: () => {
      setIsMapLoading(true);
      const viewer = viewerRef.current;
      if (!viewer) return;
      overlayMapRef.current.clear();
      viewer.clearOverlays();
    },
  });

  useEffect(() => {
    syncActiveMarkerCardPosition();
  }, [activeMarker, drawMode, mapSourceKey, syncActiveMarkerCardPosition]);

  useEffect(() => {
    if (!markerCardSize) return;
    requestAnimationFrame(() => {
      syncActiveMarkerCardPosition();
    });
  }, [markerCardSize, syncActiveMarkerCardPosition]);

  useEffect(() => {
    const currentCount = mapMarkers.length;
    if (currentCount !== prevMarkerCountRef.current) {
      syncMarkerOverlaysRef.current();

      const viewer = viewerRef.current;
      const preservedBounds = pendingViewportBoundsRef.current;
      if (viewer && preservedBounds) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const nextViewer = viewerRef.current;
            if (!nextViewer || !pendingViewportBoundsRef.current) return;
            nextViewer.viewport.fitBounds(pendingViewportBoundsRef.current, true);
            nextViewer.viewport.applyConstraints(true);
            pendingViewportBoundsRef.current = null;
          });
        });
      }

      prevMarkerCountRef.current = currentCount;
    }
  }, [mapMarkers, syncMarkerOverlaysRef]);

  useEffect(() => {
    if (!drawMode) return;
    if (markerAddMode) {
      setMarkerAddMode(false);
    }
    setIsMarkerPanelVisible(false);
  }, [drawMode, markerAddMode, setMarkerAddMode]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const handleCanvasClick = (event: unknown) => {
      if (!markerAddMode || drawMode) return;
      const imageItem = viewer.world.getItemAt(0);
      if (!imageItem) return;
      const size = imageItem.getContentSize();
      if (!size.x || !size.y) return;
      const canvasEvent = event as { position?: OpenSeadragon.Point };
      if (!canvasEvent?.position) return;
      pendingViewportBoundsRef.current = viewer.viewport.getBounds(true);
      const viewportPoint = viewer.viewport.pointFromPixel(canvasEvent.position);
      const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);
      addMarkerAt(_.clamp(imagePoint.x / size.x, 0, 1), _.clamp(imagePoint.y / size.y, 0, 1));
    };
    viewer.addHandler('canvas-click', handleCanvasClick);
    return () => {
      viewer.removeHandler('canvas-click', handleCanvasClick);
    };
  }, [addMarkerAt, drawMode, markerAddMode]);

  useEffect(() => {
    if (!activeMarkerId || drawMode || markerAddMode) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (markerCardRef.current?.contains(target)) return;
      if (target.closest(`.${styles.markerWorkbench}`)) return;
      if (target.closest(`.${styles.mapStageSelectionButton}`)) return;
      if (target.closest(`.${styles.mapMarker}`)) return;
      setActiveMarkerId(null);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [activeMarkerId, drawMode, markerAddMode, setActiveMarkerId]);

  const markerCardPortalTarget = getViewerOverlayHost();

  return (
    <div className={styles.mapTab} data-page="map">
      <div className={styles.mapContent}>
        <MapToolbar
          mapMarkerCount={mapMarkers.length}
          markerAddMode={markerAddMode}
          drawMode={drawMode}
          mapSourceKey={mapSourceKey}
          isMarkerPanelVisible={isMarkerPanelVisible}
          onMapSourceChange={setMapSourceKey}
          onToggleDrawMode={() => setDrawMode(prev => !prev)}
          onToggleWorkbench={() => setIsMarkerPanelVisible(prev => !prev)}
          drawColor={drawColor}
          onDrawColorChange={setDrawColor}
          onClearDraw={inlineDraw.clearCanvas}
          mapSourceList={mapSourceList}
        />

        <div className={styles.toolbarSubgrid}>
          <MarkerWorkbench
            visible={isMarkerPanelVisible}
            drawMode={drawMode}
            markerAddMode={markerAddMode}
            markerSearch={markerSearch}
            onMarkerSearchChange={setMarkerSearch}
            onToggleMarkerAddMode={() => setMarkerAddMode(prev => !prev)}
            filteredMarkers={filteredMarkers}
            activeMarkerId={activeMarkerId}
            activeMarker={activeMarker}
            editingName={editingName}
            editingGroup={editingGroup}
            editingDescription={editingDescription}
            editingImageUrls={editingImageUrls}
            onEditingNameChange={setEditingName}
            onEditingGroupChange={setEditingGroup}
            onEditingDescriptionChange={setEditingDescription}
            onEditingImageUrlsChange={setEditingImageUrls}
            onSelectMarker={setActiveMarkerId}
            onLocateMarker={focusMarker}
            onUpdateMarker={updateMarker}
            onFlushMarkerUpdate={flushMarkerUpdate}
            onDeleteMarker={deleteMarker}
          />
        </div>

        <MapStage
          drawMode={drawMode}
          markerAddMode={markerAddMode}
          isMapLoading={isMapLoading}
          activeMarker={activeMarker}
          onFocusMarker={focusMarker}
          inlineContainerRef={inlineContainerRef}
          inlineCanvasRef={inlineCanvasRef}
          drawLayerClassName={`${styles.drawLayer} ${drawMode ? styles.drawLayerActive : ''} ${
            !drawMode ? styles.drawLayerDisabled : ''
          }`}
          drawCanvasClassName={`${styles.drawCanvas} ${!drawMode ? styles.drawCanvasDisabled : ''}`}
          onInlinePointerDown={inlineDraw.handlePointerDown}
          onInlinePointerMove={inlineDraw.handlePointerMove}
          onInlinePointerUp={inlineDraw.handlePointerUp}
          onInlinePointerLeave={inlineDraw.handlePointerLeave}
          markerCardPortalTarget={markerCardPortalTarget}
          markerCardRef={markerCardRef}
          activeMarkerCardPosition={activeMarkerCardPosition}
          markerCardReady={Boolean(markerCardSize)}
        />
      </div>
    </div>
  );
};
