import { FC, PointerEventHandler, RefObject, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapMarker } from '../../../core/types/map-markers';
import {
  DEFAULT_MARKER_COLOR,
  drawColorOptions,
  markerIconLabels,
  markerIconOptions,
} from '../../../core/utils/map-constants';
import styles from '../MapTab.module.scss';

interface MapToolbarProps {
  mapMarkerCount: number;
  markerAddMode: boolean;
  drawMode: boolean;
  mapSourceKey: 'small' | 'large';
  isMarkerPanelVisible: boolean;
  onMapSourceChange: (key: 'small' | 'large') => void;
  onToggleDrawMode: () => void;
  onToggleWorkbench: () => void;
  drawColor: string;
  onDrawColorChange: (color: string) => void;
  onClearDraw: () => void;
  mapSourceList: Array<{
    key: 'small' | 'large';
    name: string;
  }>;
}

interface MarkerWorkbenchProps {
  visible: boolean;
  drawMode: boolean;
  markerAddMode: boolean;
  markerSearch: string;
  onMarkerSearchChange: (value: string) => void;
  onToggleMarkerAddMode: () => void;
  filteredMarkers: MapMarker[];
  activeMarkerId: string | null;
  activeMarker: MapMarker | null;
  editingName: string;
  editingGroup: string;
  editingDescription: string;
  editingImageUrls: string[];
  onEditingNameChange: (value: string) => void;
  onEditingGroupChange: (value: string) => void;
  onEditingDescriptionChange: (value: string) => void;
  onEditingImageUrlsChange: (value: string[]) => void;
  onSelectMarker: (id: string | null) => void;
  onLocateMarker: (marker: MapMarker) => void;
  onUpdateMarker: (id: string, patch: Partial<MapMarker>) => void;
  onFlushMarkerUpdate: (id: string) => void;
  onDeleteMarker: (id: string) => void;
}

interface MapStageProps {
  drawMode: boolean;
  markerAddMode: boolean;
  isMapLoading: boolean;
  activeMarker: MapMarker | null;
  onFocusMarker: (marker: MapMarker) => void;
  inlineContainerRef: RefObject<HTMLDivElement | null>;
  inlineCanvasRef: RefObject<HTMLCanvasElement | null>;
  drawLayerClassName: string;
  drawCanvasClassName: string;
  onInlinePointerDown: PointerEventHandler<HTMLCanvasElement>;
  onInlinePointerMove: PointerEventHandler<HTMLCanvasElement>;
  onInlinePointerUp: PointerEventHandler<HTMLCanvasElement>;
  onInlinePointerLeave: PointerEventHandler<HTMLCanvasElement>;
  markerCardPortalTarget: HTMLElement | null;
  markerCardRef: RefObject<HTMLElement | null>;
  activeMarkerCardPosition: {
    left: number;
    top: number;
    visible: boolean;
  };
  markerCardReady: boolean;
}

const getToolbarDescription = (markerAddMode: boolean, drawMode: boolean) => {
  if (markerAddMode) {
    return '当前为新增标记模式，点击地图任意位置即可落点。';
  }

  if (drawMode) {
    return '当前为涂画模式，可直接在地图上勾画并同步保存。';
  }

  return '普通浏览模式下可点选地图标记，工作台仅在手动打开后用于集中编辑。';
};

export const MapToolbar: FC<MapToolbarProps> = ({
  mapMarkerCount,
  markerAddMode,
  drawMode,
  mapSourceKey,
  isMarkerPanelVisible,
  onMapSourceChange,
  onToggleDrawMode,
  onToggleWorkbench,
  drawColor,
  onDrawColorChange,
  onClearDraw,
  mapSourceList,
}) => {
  return (
    <section className={styles.toolbar}>
      <div className={styles.toolbarMain}>
        <div className={styles.toolbarIntro}>
          <span className={styles.toolbarEyebrow}>地图舞台</span>
          <div className={styles.toolbarTitleRow}>
            <h3 className={styles.toolbarTitle}>标记与涂画工作区</h3>
            <span className={styles.toolbarMeta}>{mapMarkerCount} 个标记</span>
          </div>
          <p className={styles.toolbarDescription}>
            {getToolbarDescription(markerAddMode, drawMode)}
          </p>
        </div>
        <div className={styles.toolbarActions}>
          <div className={styles.sourceActions}>
            {mapSourceList.map(source => (
              <button
                key={source.key}
                className={`${styles.sourceButton} ${
                  mapSourceKey === source.key ? styles.sourceButtonActive : ''
                }`}
                onClick={() => onMapSourceChange(source.key)}
                type="button"
              >
                {source.name}
              </button>
            ))}
          </div>
          <button
            className={`${styles.drawToggle} ${drawMode ? styles.drawToggleActive : ''}`}
            onClick={onToggleDrawMode}
            type="button"
          >
            {drawMode ? '退出绘制' : '进入绘制'}
          </button>
          <button
            type="button"
            className={`${styles.markerWorkbenchButton} ${
              isMarkerPanelVisible ? styles.markerWorkbenchButtonActive : ''
            }`}
            onClick={onToggleWorkbench}
            disabled={drawMode}
          >
            {drawMode
              ? '绘制模式下已禁用工作台'
              : isMarkerPanelVisible
                ? '收起标记工作台'
                : '打开标记工作台'}
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
                    onClick={() => onDrawColorChange(color)}
                    aria-label={`涂画颜色 ${color}`}
                  />
                ))}
              </div>
            </div>
          )}
          {drawMode && (
            <button className={styles.clearButton} onClick={onClearDraw} type="button">
              清空涂画
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export const MarkerWorkbench: FC<MarkerWorkbenchProps> = ({
  visible,
  drawMode,
  markerAddMode,
  markerSearch,
  onMarkerSearchChange,
  onToggleMarkerAddMode,
  filteredMarkers,
  activeMarkerId,
  activeMarker,
  editingName,
  editingGroup,
  editingDescription,
  editingImageUrls,
  onEditingNameChange,
  onEditingGroupChange,
  onEditingDescriptionChange,
  onEditingImageUrlsChange,
  onSelectMarker,
  onLocateMarker,
  onUpdateMarker,
  onFlushMarkerUpdate,
  onDeleteMarker,
}) => {
  if (drawMode || !visible) {
    return null;
  }

  return (
    <section className={styles.markerWorkbench}>
      <div className={styles.markerPanel}>
        <div className={styles.markerPanelHeader}>
          <span className={styles.markerPanelTitle}>标记工作台</span>
          <span className={styles.markerPanelHint}>
            {markerAddMode ? '点击地图添加标记' : '支持搜索、定位与详情编辑'}
          </span>
        </div>
        <div className={styles.markerControls}>
          <button
            type="button"
            className={`${styles.markerButton} ${markerAddMode ? styles.markerButtonActive : ''}`}
            onClick={onToggleMarkerAddMode}
            disabled={drawMode}
          >
            {markerAddMode ? '取消新增' : '新增标记'}
          </button>
          <input
            className={styles.markerSearchInput}
            value={markerSearch}
            onChange={event => onMarkerSearchChange(event.target.value)}
            placeholder="搜索标记名称/分组/描述"
          />
        </div>
        <div className={styles.markerBody}>
          {!activeMarker ? (
            <div className={`${styles.markerListSection} ${styles.markerPanelPage}`}>
              <div className={styles.markerListHeader}>
                <span className={styles.markerListTitle}>标记列表</span>
                <span className={styles.markerListMeta}>{filteredMarkers.length} 条</span>
              </div>
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
                      onClick={() => onSelectMarker(marker.id)}
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
                            onLocateMarker(marker);
                          }}
                        >
                          定位
                        </button>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className={`${styles.markerEditorSection} ${styles.markerPanelPage}`}>
              <div className={styles.markerEditorSectionHeader}>
                <button
                  type="button"
                  className={styles.markerBackButton}
                  onClick={() => onSelectMarker(null)}
                >
                  返回列表
                </button>
                <span className={styles.markerEditorSectionMeta}>
                  {activeMarker.name || '未命名标记'}
                </span>
              </div>
              <div className={styles.markerEditor}>
                <>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>名称</label>
                    <input
                      className={styles.formInput}
                      value={editingName}
                      onChange={event => onEditingNameChange(event.target.value)}
                      onBlur={() => {
                        onUpdateMarker(activeMarker.id, { name: editingName });
                        onFlushMarkerUpdate(activeMarker.id);
                      }}
                      placeholder="输入标记名称"
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>分组</label>
                    <input
                      className={styles.formInput}
                      value={editingGroup}
                      onChange={event => onEditingGroupChange(event.target.value)}
                      onBlur={() => {
                        onUpdateMarker(activeMarker.id, { group: editingGroup });
                        onFlushMarkerUpdate(activeMarker.id);
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
                            onUpdateMarker(activeMarker.id, { icon });
                            onFlushMarkerUpdate(activeMarker.id);
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
                      {drawColorOptions.map(color => (
                        <button
                          key={color}
                          type="button"
                          className={`${styles.markerColorButton} ${
                            activeMarker.color === color ? styles.markerColorButtonActive : ''
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            onUpdateMarker(activeMarker.id, { color });
                            onFlushMarkerUpdate(activeMarker.id);
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
                      onChange={event => onEditingDescriptionChange(event.target.value)}
                      onBlur={() => {
                        onUpdateMarker(activeMarker.id, {
                          description: editingDescription,
                        });
                        onFlushMarkerUpdate(activeMarker.id);
                      }}
                      placeholder="输入标记说明"
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>
                      图片链接组
                      <span className={styles.formLabelHint}>
                        （每行一个链接，支持多张图片轮播）
                      </span>
                    </label>
                    <textarea
                      className={styles.formTextarea}
                      value={editingImageUrls.join('\n')}
                      onChange={event => {
                        const urls = event.target.value.split('\n').map(url => url.trim());
                        onEditingImageUrlsChange(urls);
                      }}
                      onBlur={() => {
                        const validUrls = editingImageUrls.filter(url => url.length > 0);
                        onUpdateMarker(activeMarker.id, { imageUrls: validUrls });
                        onFlushMarkerUpdate(activeMarker.id);
                      }}
                      placeholder="每行输入一个图片链接&#10;例如：https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                    />
                    {editingImageUrls.filter(url => url.length > 0).length > 0 && (
                      <div className={styles.imagePreviewList}>
                        {editingImageUrls
                          .filter(url => url.length > 0)
                          .map((url, index) => (
                            <div key={index} className={styles.imagePreviewItem}>
                              <img
                                src={url}
                                alt={`预览 ${index + 1}`}
                                className={styles.imagePreviewThumb}
                                onError={event => {
                                  (event.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <button
                                type="button"
                                className={styles.imagePreviewRemove}
                                onClick={() => {
                                  const newUrls = editingImageUrls.filter((_, i) => i !== index);
                                  onEditingImageUrlsChange(newUrls);
                                  onUpdateMarker(activeMarker.id, {
                                    imageUrls: newUrls.filter(item => item.length > 0),
                                  });
                                  onFlushMarkerUpdate(activeMarker.id);
                                }}
                              >
                                <i className="fa-solid fa-xmark" />
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.markerDeleteButton}
                      onClick={() => onDeleteMarker(activeMarker.id)}
                    >
                      删除标记
                    </button>
                  </div>
                </>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export const MapStage: FC<MapStageProps> = ({
  drawMode,
  markerAddMode,
  isMapLoading,
  activeMarker,
  onFocusMarker,
  inlineContainerRef,
  inlineCanvasRef,
  drawLayerClassName,
  drawCanvasClassName,
  onInlinePointerDown,
  onInlinePointerMove,
  onInlinePointerUp,
  onInlinePointerLeave,
  markerCardPortalTarget,
  markerCardRef,
  activeMarkerCardPosition,
  markerCardReady,
}) => {
  const validImageUrls = useMemo(
    () => activeMarker?.imageUrls?.filter(url => url.trim()) ?? [],
    [activeMarker],
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [activeMarker?.id]);

  const activeImageUrl = validImageUrls[activeImageIndex] ?? validImageUrls[0] ?? null;
  const hasMultipleImages = validImageUrls.length > 1;

  const handlePrevImage = () => {
    setActiveImageIndex(prev => (prev - 1 + validImageUrls.length) % validImageUrls.length);
  };

  const handleNextImage = () => {
    setActiveImageIndex(prev => (prev + 1) % validImageUrls.length);
  };

  return (
    <div className={styles.mapWorkspace}>
      <section className={styles.mapStage}>
        <div className={styles.mapStageHeader}>
          <div className={styles.mapStageStatus}>
            <span className={styles.mapStageBadge}>
              {drawMode ? '绘制模式' : markerAddMode ? '新增标记模式' : '浏览模式'}
            </span>
            <span className={styles.mapStageHint}>
              {isMapLoading ? '地图资源加载中…' : '支持缩放、平移、点击标记与落点新增'}
            </span>
          </div>
          <div className={styles.mapStageSelection}>
            <span className={styles.mapStageSelectionLabel}>当前选中</span>
            {activeMarker ? (
              <button
                type="button"
                className={styles.mapStageSelectionButton}
                onClick={() => onFocusMarker(activeMarker)}
              >
                <span
                  className={styles.mapStageSelectionDot}
                  style={{ backgroundColor: activeMarker.color ?? DEFAULT_MARKER_COLOR }}
                />
                <span>{activeMarker.name || '未命名标记'}</span>
              </button>
            ) : (
              <div className={styles.mapStageSelectionEmpty}>尚未选中标记</div>
            )}
          </div>
        </div>

        <div className={styles.mapViewport}>
          <div className={styles.mapFrame}>
            <div ref={inlineContainerRef} className={styles.mapViewer} />
            {isMapLoading && (
              <div className={styles.mapPlaceholder}>
                <span>地图加载中，请稍候…</span>
              </div>
            )}
            <div className={drawLayerClassName}>
              <canvas
                ref={inlineCanvasRef}
                className={drawCanvasClassName}
                onPointerDown={onInlinePointerDown}
                onPointerMove={onInlinePointerMove}
                onPointerUp={onInlinePointerUp}
                onPointerLeave={onInlinePointerLeave}
              />
            </div>
            {activeMarker &&
              !drawMode &&
              activeMarkerCardPosition.visible &&
              markerCardPortalTarget &&
              createPortal(
                <article
                  ref={markerCardRef}
                  className={styles.mapMarkerCardHost}
                  style={
                    markerCardReady
                      ? {
                          left: `${activeMarkerCardPosition.left}px`,
                          top: `${activeMarkerCardPosition.top}px`,
                        }
                      : {
                          left: '-9999px',
                          top: '0px',
                          transform: 'none',
                          visibility: 'hidden',
                          pointerEvents: 'none',
                        }
                  }
                >
                  {activeImageUrl && (
                    <div className={styles.mapMarkerCardMedia}>
                      {hasMultipleImages && (
                        <button
                          type="button"
                          className={`${styles.mapMarkerCardCarouselButton} ${styles.mapMarkerCardCarouselButtonPrev}`}
                          onClick={handlePrevImage}
                          aria-label="查看上一张图片"
                        >
                          <i className="fa-solid fa-chevron-left" />
                        </button>
                      )}
                      <img
                        src={activeImageUrl}
                        alt={`${activeMarker.name || '标记'}主视觉`}
                        className={styles.mapMarkerCardHeroImage}
                        onError={event => {
                          (event.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {hasMultipleImages && (
                        <>
                          <button
                            type="button"
                            className={`${styles.mapMarkerCardCarouselButton} ${styles.mapMarkerCardCarouselButtonNext}`}
                            onClick={handleNextImage}
                            aria-label="查看下一张图片"
                          >
                            <i className="fa-solid fa-chevron-right" />
                          </button>
                          <div className={styles.mapMarkerCardCarouselDots}>
                            {validImageUrls.map((_, index) => (
                              <button
                                key={`${activeMarker.id}-dot-${index}`}
                                type="button"
                                className={`${styles.mapMarkerCardCarouselDot} ${
                                  index === activeImageIndex
                                    ? styles.mapMarkerCardCarouselDotActive
                                    : ''
                                }`}
                                onClick={() => setActiveImageIndex(index)}
                                aria-label={`查看第 ${index + 1} 张图片`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <div className={styles.mapMarkerCardHeader}>
                    <div className={styles.mapMarkerCardTitleBlock}>
                      <span
                        className={styles.mapMarkerCardDot}
                        style={{ backgroundColor: activeMarker.color ?? DEFAULT_MARKER_COLOR }}
                      />
                      <div className={styles.mapMarkerCardHeading}>
                        <div className={styles.mapMarkerCardTitle}>
                          {activeMarker.name || '未命名标记'}
                        </div>
                        <div className={styles.mapMarkerCardMeta}>
                          {activeMarker.group || '未分组'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.mapMarkerCardBody}>
                    <p className={styles.mapMarkerCardDescription}>
                      {activeMarker.description || '暂无说明'}
                    </p>
                  </div>
                </article>,
                markerCardPortalTarget,
              )}
          </div>
        </div>
      </section>
    </div>
  );
};
