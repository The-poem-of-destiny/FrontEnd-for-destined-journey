import OpenSeadragon from 'openseadragon';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapMarker } from '../types/map-markers';
import { DEFAULT_MARKER_COLOR, DEFAULT_MARKER_ICON } from '../utils/map-constants';

interface UseMapMarkersOptions {
  viewerRef: React.RefObject<OpenSeadragon.Viewer | null>;
  classNames: {
    mapMarker: string;
    mapMarkerActive: string;
    mapMarkerIcon: string;
    mapMarkerIconNode: string;
    mapMarkerLabel: string;
    mapMarkerCard: string;
    mapMarkerTitle: string;
    mapMarkerGroup: string;
    mapMarkerSummary: string;
  };
  onMarkerSelect?: (id: string | null) => void;
}

interface UseMapMarkersResult {
  markers: MapMarker[];
  setMarkers: React.Dispatch<React.SetStateAction<MapMarker[]>>;
  activeMarkerId: string | null;
  setActiveMarkerId: React.Dispatch<React.SetStateAction<string | null>>;
  markerAddMode: boolean;
  setMarkerAddMode: React.Dispatch<React.SetStateAction<boolean>>;
  updateMarker: (id: string, patch: Partial<MapMarker>) => void;
  deleteMarker: (id: string) => void;
  addMarkerAt: (nx: number, ny: number) => void;
  focusMarker: (marker: MapMarker) => void;
  getNormalizedPointFromClient: (
    clientX: number,
    clientY: number,
  ) => { nx: number; ny: number } | null;
  syncMarkerOverlaysRef: React.RefObject<() => void>;
  updateSingleMarkerRef: React.RefObject<(id: string) => void>;
  viewerRef: React.RefObject<OpenSeadragon.Viewer | null>;
  overlayMapRef: React.RefObject<Map<string, HTMLElement>>;
}

export const useMapMarkers = ({
  viewerRef,
  classNames,
  onMarkerSelect,
}: UseMapMarkersOptions): UseMapMarkersResult => {
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [markerAddMode, setMarkerAddMode] = useState(false);
  const overlayMapRef = useRef<Map<string, HTMLElement>>(new Map());
  const syncMarkerOverlaysRef = useRef<() => void>(() => undefined);
  const updateSingleMarkerRef = useRef<(id: string) => void>(() => undefined);
  const createMarkerElementRef = useRef<(marker: MapMarker) => HTMLElement>(null!);
  const updateMarkerElementRef = useRef<
    (element: HTMLElement, marker: MapMarker, isActive: boolean) => void
  >(null!);
  const activeMarkerIdRef = useRef<string | null>(null);
  const mapMarkersRef = useRef<MapMarker[]>([]);

  const createMarkerId = () => {
    return `marker-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  };

  const updateMarker = useCallback((id: string, patch: Partial<MapMarker>) => {
    setMapMarkers(prev =>
      prev.map(marker =>
        marker.id === id
          ? {
              ...marker,
              ...patch,
              position: patch.position ?? marker.position,
            }
          : marker,
      ),
    );
  }, []);

  const deleteMarker = useCallback(
    (id: string) => {
      setMapMarkers(prev => prev.filter(marker => marker.id !== id));
      setActiveMarkerId(prev => (prev === id ? null : prev));
      onMarkerSelect?.(null);
    },
    [onMarkerSelect],
  );

  const addMarkerAt = useCallback(
    (nx: number, ny: number) => {
      const id = createMarkerId();
      const newMarker: MapMarker = {
        id,
        name: '新标记',
        group: '',
        description: '',
        icon: DEFAULT_MARKER_ICON,
        color: DEFAULT_MARKER_COLOR,
        position: { nx, ny },
      };
      setMapMarkers(prev => [...prev, newMarker]);
      setActiveMarkerId(id);
      setMarkerAddMode(false);
      onMarkerSelect?.(id);
    },
    [onMarkerSelect],
  );

  const focusMarker = useCallback((marker: MapMarker) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const imageItem = viewer.world.getItemAt(0);
    if (!imageItem) return;
    const size = imageItem.getContentSize();
    if (!size.x || !size.y) return;
    const imagePoint = new OpenSeadragon.Point(
      marker.position.nx * size.x,
      marker.position.ny * size.y,
    );
    const viewportPoint = viewer.viewport.imageToViewportCoordinates(imagePoint);
    // 使用立即定位避免动画卡顿
    viewer.viewport.panTo(viewportPoint, true);
    viewer.viewport.applyConstraints(true);
  }, []);

  const getNormalizedPointFromClient = useCallback((clientX: number, clientY: number) => {
    const viewer = viewerRef.current;
    if (!viewer) return null;
    const imageItem = viewer.world.getItemAt(0);
    if (!imageItem) return null;
    const size = imageItem.getContentSize();
    if (!size.x || !size.y) return null;
    const rect = viewer.element.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const viewerPoint = new OpenSeadragon.Point(clientX - rect.left, clientY - rect.top);
    const imagePoint = viewer.viewport.viewerElementToImageCoordinates(viewerPoint);
    return {
      nx: _.clamp(imagePoint.x / size.x, 0, 1),
      ny: _.clamp(imagePoint.y / size.y, 0, 1),
    };
  }, []);

  const updateMarkerElement = useCallback(
    (element: HTMLElement, marker: MapMarker, isActive: boolean) => {
      element.className =
        `${classNames.mapMarker} ${isActive ? classNames.mapMarkerActive : ''}`.trim();
      const iconElement = element.querySelector(
        `.${classNames.mapMarkerIcon}`,
      ) as HTMLDivElement | null;
      const iconNode = element.querySelector(
        `.${classNames.mapMarkerIconNode}`,
      ) as HTMLElement | null;
      const labelElement = element.querySelector(
        `.${classNames.mapMarkerLabel}`,
      ) as HTMLDivElement | null;
      const titleElement = element.querySelector(
        `.${classNames.mapMarkerTitle}`,
      ) as HTMLDivElement | null;
      const groupElement = element.querySelector(
        `.${classNames.mapMarkerGroup}`,
      ) as HTMLDivElement | null;
      const summaryElement = element.querySelector(
        `.${classNames.mapMarkerSummary}`,
      ) as HTMLDivElement | null;

      if (iconElement) {
        const color = marker.color ?? DEFAULT_MARKER_COLOR;
        iconElement.style.color = color;
      }
      if (iconNode) {
        const iconKey = marker.icon ?? DEFAULT_MARKER_ICON;
        iconNode.className = `${classNames.mapMarkerIconNode} ${iconKey}`;
      }
      if (labelElement) {
        labelElement.textContent = marker.name || '未命名标记';
      }
      if (titleElement) {
        titleElement.textContent = marker.name || '未命名标记';
      }
      if (groupElement) {
        if (marker.group) {
          groupElement.textContent = marker.group;
          groupElement.style.display = 'block';
        } else {
          groupElement.style.display = 'none';
        }
      }
      if (summaryElement) {
        if (marker.description) {
          summaryElement.textContent = marker.description;
          summaryElement.style.display = 'block';
        } else {
          summaryElement.style.display = 'none';
        }
      }
    },
    [classNames],
  );

  const createMarkerElement = useCallback(
    (marker: MapMarker) => {
      const element = document.createElement('div');
      element.className = classNames.mapMarker;
      element.dataset.markerId = marker.id;
      element.setAttribute('role', 'button');
      element.tabIndex = 0;

      const iconElement = document.createElement('div');
      iconElement.className = classNames.mapMarkerIcon;
      const iconNode = document.createElement('i');
      iconNode.className = classNames.mapMarkerIconNode;
      iconElement.appendChild(iconNode);

      const labelElement = document.createElement('div');
      labelElement.className = classNames.mapMarkerLabel;

      const cardElement = document.createElement('div');
      cardElement.className = classNames.mapMarkerCard;
      const titleElement = document.createElement('div');
      titleElement.className = classNames.mapMarkerTitle;
      const groupElement = document.createElement('div');
      groupElement.className = classNames.mapMarkerGroup;
      const summaryElement = document.createElement('div');
      summaryElement.className = classNames.mapMarkerSummary;
      cardElement.append(titleElement, groupElement, summaryElement);

      element.append(iconElement, labelElement, cardElement);

      const handleSelect = () => {
        setActiveMarkerId(marker.id);
        onMarkerSelect?.(marker.id);
      };

      element.addEventListener('click', handleSelect);

      return element;
    },
    [classNames, onMarkerSelect],
  );

  // 保持回调函数和状态的最新引用，避免 syncMarkerOverlays 依赖频繁变化
  useEffect(() => {
    createMarkerElementRef.current = createMarkerElement;
  }, [createMarkerElement]);

  useEffect(() => {
    updateMarkerElementRef.current = updateMarkerElement;
  }, [updateMarkerElement]);

  useEffect(() => {
    activeMarkerIdRef.current = activeMarkerId;
  }, [activeMarkerId]);

  useEffect(() => {
    mapMarkersRef.current = mapMarkers;
  }, [mapMarkers]);

  // 使用 ref 获取最新状态，避免 useCallback 依赖变化
  const syncMarkerOverlays = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const imageItem = viewer.world.getItemAt(0);
    if (!imageItem) return;
    const size = imageItem.getContentSize();
    if (!size.x || !size.y) return;
    const overlayMap = overlayMapRef.current;
    const markers = mapMarkersRef.current;
    const markerIds = new Set(markers.map(marker => marker.id));
    const currentActiveId = activeMarkerIdRef.current;

    // 移除已删除的标记
    overlayMap.forEach((element, id) => {
      if (!markerIds.has(id)) {
        viewer.removeOverlay(element);
        overlayMap.delete(id);
      }
    });

    markers.forEach(marker => {
      const imagePoint = new OpenSeadragon.Point(
        marker.position.nx * size.x,
        marker.position.ny * size.y,
      );
      const viewportPoint = viewer.viewport.imageToViewportCoordinates(imagePoint);
      let element = overlayMap.get(marker.id);

      if (!element) {
        // 仅新标记需要创建和添加 overlay
        element = createMarkerElementRef.current(marker);
        overlayMap.set(marker.id, element);
        viewer.addOverlay({
          element,
          location: viewportPoint,
          placement: OpenSeadragon.Placement.CENTER,
        });
      } else {
        // 已存在的标记仅更新位置，避免重新添加 overlay
        viewer.updateOverlay(element, viewportPoint, OpenSeadragon.Placement.CENTER);
      }
      // 更新标记元素内容（名称、颜色、激活状态等）
      updateMarkerElementRef.current(element, marker, marker.id === currentActiveId);
    });
  }, []);

  // 轻量级更新：仅更新标记的激活状态样式，不重新同步整个 overlay
  const updateActiveState = useCallback(() => {
    const overlayMap = overlayMapRef.current;
    const currentActiveId = activeMarkerIdRef.current;
    const markers = mapMarkersRef.current;
    overlayMap.forEach((element, id) => {
      const marker = markers.find(marker => marker.id === id);
      if (marker) {
        updateMarkerElementRef.current(element, marker, id === currentActiveId);
      }
    });
  }, []);

  // 轻量级更新：仅更新单个标记的 DOM 内容，不触发完整的 overlay 同步
  const updateSingleMarker = useCallback((id: string) => {
    const overlayMap = overlayMapRef.current;
    const element = overlayMap.get(id);
    if (!element) return;
    const markers = mapMarkersRef.current;
    const marker = markers.find(marker => marker.id === id);
    if (!marker) return;
    const currentActiveId = activeMarkerIdRef.current;
    updateMarkerElementRef.current(element, marker, id === currentActiveId);
  }, []);

  useEffect(() => {
    syncMarkerOverlaysRef.current = syncMarkerOverlays;
  }, [syncMarkerOverlays]);

  useEffect(() => {
    updateSingleMarkerRef.current = updateSingleMarker;
  }, [updateSingleMarker]);

  // 当 activeMarkerId 变化时，仅更新激活状态而不重新同步 overlay
  useEffect(() => {
    updateActiveState();
  }, [activeMarkerId, updateActiveState]);

  return {
    markers: mapMarkers,
    setMarkers: setMapMarkers,
    activeMarkerId,
    setActiveMarkerId,
    markerAddMode,
    setMarkerAddMode,
    updateMarker,
    deleteMarker,
    addMarkerAt,
    focusMarker,
    getNormalizedPointFromClient,
    syncMarkerOverlaysRef,
    updateSingleMarkerRef,
    viewerRef,
    overlayMapRef,
  };
};
