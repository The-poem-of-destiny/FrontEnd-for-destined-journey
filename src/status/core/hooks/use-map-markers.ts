import OpenSeadragon from 'openseadragon';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapMarker } from '../types/map-markers';
import { DEFAULT_MARKER_COLOR, DEFAULT_MARKER_ICON } from '../utils/map-constants';

interface UseMapMarkersOptions {
  viewerRef: React.RefObject<OpenSeadragon.Viewer | null>;
  classNames: {
    mapMarker: string;
    mapMarkerActive: string;
    mapMarkerDrawMode: string;
    mapMarkerIcon: string;
    mapMarkerIconNode: string;
    mapMarkerLabel: string;
    mapMarkerCard: string;
    mapMarkerTitle: string;
    mapMarkerGroup: string;
    mapMarkerSummary: string;
    mapMarkerCarousel: string;
    mapMarkerCarouselInner: string;
    mapMarkerCarouselItem: string;
    mapMarkerCarouselItemActive: string;
    mapMarkerCarouselNav: string;
    mapMarkerCarouselDot: string;
    mapMarkerCarouselDotActive: string;
    mapMarkerCarouselArrow: string;
    mapMarkerCarouselArrowPrev: string;
    mapMarkerCarouselArrowNext: string;
  };
  drawMode?: boolean;
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
  updateCardPositionRef: React.RefObject<() => void>;
  viewerRef: React.RefObject<OpenSeadragon.Viewer | null>;
  overlayMapRef: React.RefObject<Map<string, HTMLElement>>;
}

export const useMapMarkers = ({
  viewerRef,
  classNames,
  drawMode = false,
  onMarkerSelect,
}: UseMapMarkersOptions): UseMapMarkersResult => {
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [markerAddMode, setMarkerAddMode] = useState(false);
  const overlayMapRef = useRef<Map<string, HTMLElement>>(new Map());
  // 卡片元素映射（Portal 到 body 的卡片）
  const cardMapRef = useRef<Map<string, HTMLElement>>(new Map());
  const syncMarkerOverlaysRef = useRef<() => void>(() => undefined);
  const updateSingleMarkerRef = useRef<(id: string) => void>(() => undefined);
  const updateCardPositionRef = useRef<() => void>(() => undefined);
  const createMarkerElementRef = useRef<(marker: MapMarker) => HTMLElement>(null!);
  const updateMarkerElementRef = useRef<
    (element: HTMLElement, marker: MapMarker, isActive: boolean) => void
  >(null!);
  const activeMarkerIdRef = useRef<string | null>(null);
  const mapMarkersRef = useRef<MapMarker[]>([]);
  // 当前显示的卡片 ID
  const visibleCardIdRef = useRef<string | null>(null);

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
      // 清理 Portal 卡片
      const cardMap = cardMapRef.current;
      const card = cardMap.get(id);
      if (card) {
        card.remove();
        cardMap.delete(id);
      }
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
      // 构建类名：基础类 + 激活状态 + 绘制模式
      const classNameParts = [classNames.mapMarker];
      if (isActive) {
        classNameParts.push(classNames.mapMarkerActive);
      }
      if (drawMode) {
        classNameParts.push(classNames.mapMarkerDrawMode);
      }
      element.className = classNameParts.join(' ');

      const iconElement = element.querySelector(
        `.${classNames.mapMarkerIcon}`,
      ) as HTMLDivElement | null;
      const iconNode = element.querySelector(
        `.${classNames.mapMarkerIconNode}`,
      ) as HTMLElement | null;
      const labelElement = element.querySelector(
        `.${classNames.mapMarkerLabel}`,
      ) as HTMLDivElement | null;

      // Portal 模式：从 cardMapRef 获取卡片元素
      const cardElement = cardMapRef.current.get(marker.id);
      const titleElement = cardElement?.querySelector(
        `.${classNames.mapMarkerTitle}`,
      ) as HTMLDivElement | null;
      const groupElement = cardElement?.querySelector(
        `.${classNames.mapMarkerGroup}`,
      ) as HTMLDivElement | null;
      const summaryElement = cardElement?.querySelector(
        `.${classNames.mapMarkerSummary}`,
      ) as HTMLDivElement | null;
      const carouselElement = cardElement?.querySelector(
        `.${classNames.mapMarkerCarousel}`,
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
      // 处理轮播图
      if (carouselElement) {
        const imageUrls = marker.imageUrls ?? [];
        if (imageUrls.length > 0) {
          carouselElement.style.display = 'block';
          const innerElement = carouselElement.querySelector(
            `.${classNames.mapMarkerCarouselInner}`,
          ) as HTMLDivElement | null;
          const navElement = carouselElement.querySelector(
            `.${classNames.mapMarkerCarouselNav}`,
          ) as HTMLDivElement | null;
          const prevArrow = carouselElement.querySelector(
            `.${classNames.mapMarkerCarouselArrowPrev}`,
          ) as HTMLButtonElement | null;
          const nextArrow = carouselElement.querySelector(
            `.${classNames.mapMarkerCarouselArrowNext}`,
          ) as HTMLButtonElement | null;

          if (innerElement) {
            // 清空现有图片
            innerElement.innerHTML = '';
            // 添加新图片
            imageUrls.forEach((url, index) => {
              const itemElement = document.createElement('div');
              itemElement.className = `${classNames.mapMarkerCarouselItem} ${
                index === 0 ? classNames.mapMarkerCarouselItemActive : ''
              }`;
              const imgElement = document.createElement('img');
              imgElement.src = url;
              imgElement.alt = `${marker.name || '标记'} - 图片 ${index + 1}`;
              itemElement.appendChild(imgElement);
              innerElement.appendChild(itemElement);
            });
          }

          // 切换到指定索引的图片
          const switchToIndex = (targetIndex: number) => {
            const items = innerElement?.querySelectorAll(`.${classNames.mapMarkerCarouselItem}`);
            const dots = navElement?.querySelectorAll(`.${classNames.mapMarkerCarouselDot}`);
            items?.forEach((item, i) => {
              item.className = `${classNames.mapMarkerCarouselItem} ${
                i === targetIndex ? classNames.mapMarkerCarouselItemActive : ''
              }`;
            });
            dots?.forEach((dot, i) => {
              dot.className = `${classNames.mapMarkerCarouselDot} ${
                i === targetIndex ? classNames.mapMarkerCarouselDotActive : ''
              }`;
            });
          };

          // 获取当前激活的索引
          const getCurrentIndex = () => {
            const items = innerElement?.querySelectorAll(`.${classNames.mapMarkerCarouselItem}`);
            if (!items) return 0;
            for (let i = 0; i < items.length; i++) {
              if (items[i].classList.contains(classNames.mapMarkerCarouselItemActive)) {
                return i;
              }
            }
            return 0;
          };

          // 多张图片时显示箭头
          if (imageUrls.length > 1) {
            if (prevArrow) {
              prevArrow.style.display = 'flex';
              prevArrow.onclick = event => {
                event.stopPropagation();
                const currentIndex = getCurrentIndex();
                const newIndex = currentIndex === 0 ? imageUrls.length - 1 : currentIndex - 1;
                switchToIndex(newIndex);
              };
            }
            if (nextArrow) {
              nextArrow.style.display = 'flex';
              nextArrow.onclick = event => {
                event.stopPropagation();
                const currentIndex = getCurrentIndex();
                const newIndex = currentIndex === imageUrls.length - 1 ? 0 : currentIndex + 1;
                switchToIndex(newIndex);
              };
            }
          } else {
            if (prevArrow) prevArrow.style.display = 'none';
            if (nextArrow) nextArrow.style.display = 'none';
          }

          if (navElement) {
            // 清空现有导航点
            navElement.innerHTML = '';
            // 只有多张图片时才显示导航点
            if (imageUrls.length > 1) {
              navElement.style.display = 'flex';
              imageUrls.forEach((_, index) => {
                const dotElement = document.createElement('button');
                dotElement.className = `${classNames.mapMarkerCarouselDot} ${
                  index === 0 ? classNames.mapMarkerCarouselDotActive : ''
                }`;
                dotElement.type = 'button';
                dotElement.dataset.index = String(index);
                dotElement.addEventListener('click', event => {
                  event.stopPropagation();
                  switchToIndex(index);
                });
                navElement.appendChild(dotElement);
              });
            } else {
              navElement.style.display = 'none';
            }
          }
        } else {
          carouselElement.style.display = 'none';
        }
      }
    },
    [classNames, drawMode],
  );

  // 创建 Portal 卡片容器（全局唯一）
  const getOrCreateCardContainer = useCallback(() => {
    let container = document.getElementById('map-marker-card-portal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'map-marker-card-portal';
      container.style.cssText =
        'position: fixed; top: 0; left: 0; z-index: 10000; pointer-events: none;';
      document.body.appendChild(container);
    }
    return container;
  }, []);

  // 更新卡片位置（根据标记元素位置重新计算）
  const updateCardPosition = useCallback(() => {
    const visibleId = visibleCardIdRef.current;
    if (!visibleId) return;

    const cardMap = cardMapRef.current;
    const overlayMap = overlayMapRef.current;
    const card = cardMap.get(visibleId);
    const markerElement = overlayMap.get(visibleId);
    if (!card || !markerElement) return;

    // 检查卡片是否显示
    if (card.style.display === 'none') return;

    // 计算标记在视口中的位置
    const markerRect = markerElement.getBoundingClientRect();

    // 获取卡片实际尺寸
    const cardRect = card.getBoundingClientRect();
    const cardWidth = cardRect.width || 300;

    // 边距常量
    const margin = 10;
    const gap = 10; // 卡片与标记的间距

    // 计算水平位置：优先居中，超出左右边界时调整
    let leftPos = markerRect.left + markerRect.width / 2 - cardWidth / 2;

    // 水平边界检测：防止卡片超出视口左右
    if (leftPos < margin) {
      leftPos = margin;
    } else if (leftPos + cardWidth > window.innerWidth - margin) {
      leftPos = window.innerWidth - cardWidth - margin;
    }

    // 垂直位置：卡片显示在标记上方
    const bottomPos = window.innerHeight - markerRect.top + gap;

    card.style.left = `${leftPos}px`;
    card.style.bottom = `${bottomPos}px`;
  }, []);

  // 显示卡片并定位
  const showCard = useCallback((markerId: string, markerElement: HTMLElement) => {
    const cardMap = cardMapRef.current;
    const card = cardMap.get(markerId);
    if (!card) return;

    // 隐藏其他卡片
    cardMap.forEach((c, id) => {
      if (id !== markerId) {
        c.style.display = 'none';
      }
    });

    // 计算标记在视口中的位置
    const markerRect = markerElement.getBoundingClientRect();

    // 先临时显示卡片以获取实际尺寸（不可见位置）
    card.style.cssText = `
      position: fixed;
      left: -9999px;
      top: -9999px;
      display: block;
      visibility: hidden;
      pointer-events: none;
    `;
    const cardRect = card.getBoundingClientRect();
    const cardWidth = cardRect.width || 300;

    // 边距常量
    const margin = 10;
    const gap = 10; // 卡片与标记的间距

    // 计算水平位置：优先居中，超出左右边界时调整
    let leftPos = markerRect.left + markerRect.width / 2 - cardWidth / 2;

    // 水平边界检测：防止卡片超出视口左右
    if (leftPos < margin) {
      leftPos = margin;
    } else if (leftPos + cardWidth > window.innerWidth - margin) {
      leftPos = window.innerWidth - cardWidth - margin;
    }

    // 垂直位置：卡片显示在标记上方
    const bottomPos = window.innerHeight - markerRect.top + gap;

    card.style.cssText = `
      position: fixed;
      left: ${leftPos}px;
      bottom: ${bottomPos}px;
      display: block;
      pointer-events: auto;
      z-index: 10001;
    `;
    visibleCardIdRef.current = markerId;
  }, []);

  // 隐藏卡片
  const hideCard = useCallback((markerId: string) => {
    const cardMap = cardMapRef.current;
    const card = cardMap.get(markerId);
    if (card) {
      card.style.display = 'none';
    }
    if (visibleCardIdRef.current === markerId) {
      visibleCardIdRef.current = null;
    }
  }, []);

  // 隐藏所有卡片
  const hideAllCards = useCallback(() => {
    const cardMap = cardMapRef.current;
    cardMap.forEach(card => {
      card.style.display = 'none';
    });
    visibleCardIdRef.current = null;
  }, []);

  // 创建 Portal 卡片元素
  const createCardElement = useCallback(
    (marker: MapMarker) => {
      const cardElement = document.createElement('div');
      cardElement.className = classNames.mapMarkerCard;
      cardElement.style.display = 'none';
      cardElement.dataset.markerId = marker.id;

      // 阻止卡片上的点击事件冒泡
      cardElement.addEventListener('click', event => {
        event.stopPropagation();
      });
      cardElement.addEventListener('mousedown', event => {
        event.stopPropagation();
      });
      cardElement.addEventListener('pointerdown', event => {
        event.stopPropagation();
      });

      // 鼠标进入卡片时保持显示
      cardElement.addEventListener('mouseenter', () => {
        visibleCardIdRef.current = marker.id;
      });

      // 鼠标离开卡片时隐藏
      cardElement.addEventListener('mouseleave', () => {
        hideCard(marker.id);
      });

      const titleElement = document.createElement('div');
      titleElement.className = classNames.mapMarkerTitle;
      const groupElement = document.createElement('div');
      groupElement.className = classNames.mapMarkerGroup;
      const summaryElement = document.createElement('div');
      summaryElement.className = classNames.mapMarkerSummary;

      // 创建轮播图容器
      const carouselElement = document.createElement('div');
      carouselElement.className = classNames.mapMarkerCarousel;
      const carouselInnerElement = document.createElement('div');
      carouselInnerElement.className = classNames.mapMarkerCarouselInner;
      const carouselNavElement = document.createElement('div');
      carouselNavElement.className = classNames.mapMarkerCarouselNav;

      // 创建左右箭头按钮
      const prevArrowElement = document.createElement('button');
      prevArrowElement.type = 'button';
      prevArrowElement.className = `${classNames.mapMarkerCarouselArrow} ${classNames.mapMarkerCarouselArrowPrev}`;
      prevArrowElement.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
      prevArrowElement.style.display = 'none';

      const nextArrowElement = document.createElement('button');
      nextArrowElement.type = 'button';
      nextArrowElement.className = `${classNames.mapMarkerCarouselArrow} ${classNames.mapMarkerCarouselArrowNext}`;
      nextArrowElement.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
      nextArrowElement.style.display = 'none';

      carouselElement.append(
        prevArrowElement,
        carouselInnerElement,
        nextArrowElement,
        carouselNavElement,
      );

      cardElement.append(titleElement, groupElement, summaryElement, carouselElement);

      // 添加到 Portal 容器
      const container = getOrCreateCardContainer();
      container.appendChild(cardElement);

      return cardElement;
    },
    [classNames, getOrCreateCardContainer, hideCard],
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

      element.append(iconElement, labelElement);

      // 创建 Portal 卡片
      const cardElement = createCardElement(marker);
      cardMapRef.current.set(marker.id, cardElement);

      // 检测是否为触摸设备
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      if (isTouchDevice) {
        // 移动端：点击切换卡片显示
        element.addEventListener('click', event => {
          event.stopPropagation();
          if (visibleCardIdRef.current === marker.id) {
            // 如果当前卡片已显示，则隐藏
            hideCard(marker.id);
          } else {
            // 否则显示当前卡片
            showCard(marker.id, element);
          }
          // 同时触发选中
          setActiveMarkerId(marker.id);
          onMarkerSelect?.(marker.id);
        });

        // 点击其他地方隐藏卡片
        const handleDocumentClick = () => {
          if (visibleCardIdRef.current === marker.id) {
            hideCard(marker.id);
          }
        };
        document.addEventListener('click', handleDocumentClick);
      } else {
        // 桌面端：hover 显示卡片
        element.addEventListener('mouseenter', () => {
          showCard(marker.id, element);
        });

        // 鼠标离开标记时，设置定时器隐藏卡片
        element.addEventListener('mouseleave', () => {
          // 给用户 100ms 时间移动到卡片上
          setTimeout(() => {
            // 检查鼠标是否在卡片上
            const card = cardMapRef.current.get(marker.id);
            if (card && !card.matches(':hover') && visibleCardIdRef.current === marker.id) {
              hideCard(marker.id);
            }
          }, 100);
        });

        // 点击选中标记
        const handleSelect = () => {
          setActiveMarkerId(marker.id);
          onMarkerSelect?.(marker.id);
        };
        element.addEventListener('click', handleSelect);
      }

      return element;
    },
    [classNames, onMarkerSelect, createCardElement, showCard, hideCard],
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

  useEffect(() => {
    updateCardPositionRef.current = updateCardPosition;
  }, [updateCardPosition]);

  // 当 activeMarkerId 变化时，仅更新激活状态而不重新同步 overlay
  useEffect(() => {
    updateActiveState();
  }, [activeMarkerId, updateActiveState]);

  // 当 drawMode 变化时，更新所有标记的绘制模式状态
  useEffect(() => {
    updateActiveState();
  }, [drawMode, updateActiveState]);

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
    updateCardPositionRef,
    viewerRef,
    overlayMapRef,
  };
};
