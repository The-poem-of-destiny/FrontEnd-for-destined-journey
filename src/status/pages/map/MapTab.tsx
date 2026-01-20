import _ from 'lodash';
import OpenSeadragon from 'openseadragon';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DrawStroke, useCanvasDraw } from '../../core/hooks/use-canvas-draw';
import { useMapMarkers } from '../../core/hooks/use-map-markers';
import { useMapViewer } from '../../core/hooks/use-map-viewer';
import { MapMarker } from '../../core/types/map-markers';
import { mapSourceList } from '../../core/types/map-source-list';
import {
  DEFAULT_DRAW_COLOR,
  DEFAULT_MARKER_COLOR,
  drawColorOptions,
  markerIconLabels,
  markerIconOptions,
} from '../../core/utils/map-constants';
import { Collapse } from '../../shared/components';
import styles from './MapTab.module.scss';

export const MapTab: FC = () => {
  const [drawMode, setDrawMode] = useState(false);
  const [drawStrokes, setDrawStrokes] = useState<DrawStroke[]>([]);
  const [drawColor, setDrawColor] = useState(DEFAULT_DRAW_COLOR);
  const [mapSourceKey, setMapSourceKey] = useState<'small' | 'large'>('small');
  const [markerSearch, setMarkerSearch] = useState('');
  // 编辑中的临时本地状态，避免每次输入都更新主状态
  const [editingName, setEditingName] = useState('');
  const [editingGroup, setEditingGroup] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const inlineContainerRef = useRef<HTMLDivElement | null>(null);
  const inlineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<OpenSeadragon.Viewer | null>(null);
  const redrawRef = useRef<() => void>(() => undefined);
  const resizeCanvasRef = useRef<() => void>(() => undefined);
  const prevMarkerCountRef = useRef<number>(0);

  const markerClassNames = useMemo(
    () => ({
      mapMarker: styles.mapMarker,
      mapMarkerActive: styles.mapMarkerActive,
      mapMarkerIcon: styles.mapMarkerIcon,
      mapMarkerIconNode: styles.mapMarkerIconNode,
      mapMarkerLabel: styles.mapMarkerLabel,
      mapMarkerCard: styles.mapMarkerCard,
      mapMarkerTitle: styles.mapMarkerTitle,
      mapMarkerGroup: styles.mapMarkerGroup,
      mapMarkerSummary: styles.mapMarkerSummary,
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
  });

  // 包装 updateMarker，仅更新状态，不立即刷新 DOM
  const updateMarker = useCallback(
    (id: string, patch: Partial<MapMarker>) => {
      updateMarkerBase(id, patch);
    },
    [updateMarkerBase],
  );

  // 在失焦时刷新单个标记的 DOM 显示
  const flushMarkerUpdate = useCallback(
    (id: string) => {
      requestAnimationFrame(() => {
        updateSingleMarkerRef.current(id);
      });
    },
    [updateSingleMarkerRef],
  );

  const markerColorOptions = drawColorOptions;

  const activeMarker = useMemo(() => {
    return mapMarkers.find(marker => marker.id === activeMarkerId) ?? null;
  }, [mapMarkers, activeMarkerId]);

  // 当选中标记变化时，同步本地编辑状态
  useEffect(() => {
    if (activeMarker) {
      setEditingName(activeMarker.name);
      setEditingGroup(activeMarker.group ?? '');
      setEditingDescription(activeMarker.description ?? '');
    }
  }, [activeMarkerId]); // 只在切换标记时同步，不监听 activeMarker 避免循环

  const filteredMarkers = useMemo(() => {
    const keyword = markerSearch.trim().toLowerCase();
    if (!keyword) return mapMarkers;
    return mapMarkers.filter(marker => {
      return [marker.name, marker.group, marker.description]
        .filter(Boolean)
        .some(text => text!.toLowerCase().includes(keyword));
    });
  }, [mapMarkers, markerSearch]);

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

  useMapViewer({
    mapSourceKey,
    viewerRef,
    containerRef: inlineContainerRef,
    onOpen: () => {
      resizeCanvasRef.current();
      redrawRef.current();
      syncMarkerOverlaysRef.current();
    },
    onUpdate: () => {
      redrawRef.current();
    },
    onBeforeOpen: () => {
      const viewer = viewerRef.current;
      if (!viewer) return;
      overlayMapRef.current.clear();
      viewer.clearOverlays();
    },
  });

  // 只在标记数量变化时（添加/删除）才触发完整同步
  useEffect(() => {
    const currentCount = mapMarkers.length;
    if (currentCount !== prevMarkerCountRef.current) {
      syncMarkerOverlaysRef.current();
      prevMarkerCountRef.current = currentCount;
    }
  }, [mapMarkers, syncMarkerOverlaysRef]);

  useEffect(() => {
    if (drawMode && markerAddMode) {
      setMarkerAddMode(false);
    }
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
      const viewportPoint = viewer.viewport.pointFromPixel(canvasEvent.position);
      const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);
      addMarkerAt(_.clamp(imagePoint.x / size.x, 0, 1), _.clamp(imagePoint.y / size.y, 0, 1));
    };
    viewer.addHandler('canvas-click', handleCanvasClick);
    return () => {
      viewer.removeHandler('canvas-click', handleCanvasClick);
    };
  }, [addMarkerAt, drawMode, markerAddMode]);

  return (
    <div className={styles.mapTab}>
      <div className={styles.mapContent}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarActions}>
            <div className={styles.sourceActions}>
              {mapSourceList.map(source => (
                <button
                  key={source.key}
                  className={`${styles.sourceButton} ${
                    mapSourceKey === source.key ? styles.sourceButtonActive : ''
                  }`}
                  onClick={() => setMapSourceKey(source.key)}
                  type="button"
                >
                  {source.name}
                </button>
              ))}
            </div>
            <button
              className={`${styles.drawToggle} ${drawMode ? styles.drawToggleActive : ''}`}
              onClick={() => setDrawMode(prev => !prev)}
              type="button"
            >
              {drawMode ? '退出绘制' : '进入绘制'}
            </button>
            {drawMode && (
              <div className={styles.drawColorPalette}>
                <span className={styles.drawColorLabel}>涂画颜色</span>
                <div className={styles.drawColorOptions}>
                  {drawColorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`${styles.drawColorButton} ${
                        drawColor === color ? styles.drawColorButtonActive : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setDrawColor(color)}
                      aria-label={`涂画颜色 ${color}`}
                    />
                  ))}
                </div>
              </div>
            )}
            {drawMode && (
              <button className={styles.clearButton} onClick={inlineDraw.clearCanvas} type="button">
                清空涂画
              </button>
            )}
          </div>
        </div>

        <Collapse
          className={styles.markerPanel}
          defaultOpen={false}
          title={
            <div className={styles.markerPanelHeader}>
              <span>标记编辑</span>
              <span className={styles.markerPanelHint}>
                {markerAddMode ? '点击地图添加标记' : '支持搜索与编辑'}
              </span>
            </div>
          }
        >
          <div className={styles.markerControls}>
            <button
              type="button"
              className={`${styles.markerButton} ${markerAddMode ? styles.markerButtonActive : ''}`}
              onClick={() => setMarkerAddMode(prev => !prev)}
              disabled={drawMode}
            >
              {markerAddMode ? '取消新增' : '新增标记'}
            </button>
            <input
              className={styles.markerSearchInput}
              value={markerSearch}
              onChange={event => setMarkerSearch(event.target.value)}
              placeholder="搜索标记名称/分组/描述"
            />
          </div>
          <div className={styles.markerBody}>
            <div className={styles.markerList}>
              {filteredMarkers.length === 0 ? (
                <div className={styles.markerEmpty}>暂无标记</div>
              ) : (
                filteredMarkers.map(marker => (
                  <button
                    key={marker.id}
                    type="button"
                    className={`${styles.markerItem} ${
                      marker.id === activeMarkerId ? styles.markerItemActive : ''
                    }`}
                    onClick={() => setActiveMarkerId(marker.id)}
                  >
                    <div className={styles.markerItemInfo}>
                      <span
                        className={styles.markerItemDot}
                        style={{ backgroundColor: marker.color ?? DEFAULT_MARKER_COLOR }}
                      />
                      <div className={styles.markerItemText}>{marker.name || '未命名标记'}</div>
                    </div>
                    <div className={styles.markerItemActions}>
                      <button
                        type="button"
                        className={styles.markerLocateButton}
                        onClick={event => {
                          event.stopPropagation();
                          focusMarker(marker);
                        }}
                      >
                        定位
                      </button>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className={styles.markerEditor}>
              {activeMarker ? (
                <>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>名称</label>
                    <input
                      className={styles.formInput}
                      value={editingName}
                      onChange={event => setEditingName(event.target.value)}
                      onBlur={() => {
                        updateMarker(activeMarker.id, { name: editingName });
                        flushMarkerUpdate(activeMarker.id);
                      }}
                      placeholder="输入标记名称"
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>分组</label>
                    <input
                      className={styles.formInput}
                      value={editingGroup}
                      onChange={event => setEditingGroup(event.target.value)}
                      onBlur={() => {
                        updateMarker(activeMarker.id, { group: editingGroup });
                        flushMarkerUpdate(activeMarker.id);
                      }}
                      placeholder="例如：城邦 / 遗迹"
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>图标</label>
                    <div className={styles.iconOptions}>
                      {markerIconOptions.map(icon => (
                        <button
                          key={icon}
                          type="button"
                          className={`${styles.iconButton} ${
                            activeMarker.icon === icon ? styles.iconButtonActive : ''
                          }`}
                          onClick={() => {
                            updateMarker(activeMarker.id, { icon });
                            flushMarkerUpdate(activeMarker.id);
                          }}
                        >
                          <i className={icon} />
                          <span className={styles.iconButtonLabel}>{markerIconLabels[icon]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>颜色</label>
                    <div className={styles.markerColorOptions}>
                      {markerColorOptions.map(color => (
                        <button
                          key={color}
                          type="button"
                          className={`${styles.markerColorButton} ${
                            activeMarker.color === color ? styles.markerColorButtonActive : ''
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            updateMarker(activeMarker.id, { color });
                            flushMarkerUpdate(activeMarker.id);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>描述</label>
                    <textarea
                      className={styles.formTextarea}
                      value={editingDescription}
                      onChange={event => setEditingDescription(event.target.value)}
                      onBlur={() => {
                        updateMarker(activeMarker.id, { description: editingDescription });
                        flushMarkerUpdate(activeMarker.id);
                      }}
                      placeholder="输入标记说明"
                    />
                  </div>
                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.markerDeleteButton}
                      onClick={() => deleteMarker(activeMarker.id)}
                    >
                      删除标记
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.markerEmpty}>选择一个标记开始编辑</div>
              )}
            </div>
          </div>
        </Collapse>

        <div className={styles.mapFrame}>
          <div ref={inlineContainerRef} className={styles.mapViewer} />
          <div
            className={`${styles.drawLayer} ${drawMode ? styles.drawLayerActive : ''} ${
              !drawMode ? styles.drawLayerDisabled : ''
            }`}
          >
            <canvas
              ref={inlineCanvasRef}
              className={`${styles.drawCanvas} ${!drawMode ? styles.drawCanvasDisabled : ''}`}
              onPointerDown={inlineDraw.handlePointerDown}
              onPointerMove={inlineDraw.handlePointerMove}
              onPointerUp={inlineDraw.handlePointerUp}
              onPointerLeave={inlineDraw.handlePointerLeave}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
