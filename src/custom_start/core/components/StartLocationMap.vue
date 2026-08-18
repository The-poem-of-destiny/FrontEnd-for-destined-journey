<script setup lang="ts">
import OpenSeadragon, { ImageTileSource } from 'openseadragon';

interface Props {
  selectedLocation?: string;
}

withDefaults(defineProps<Props>(), {
  selectedLocation: '',
});

type MapSourceKey = 'low' | 'small' | 'large';
type ViewerStatus = 'loading' | 'ready' | 'error';

const mapSources: Array<{ key: MapSourceKey; label: string; url: string }> = [
  {
    key: 'low',
    label: '流畅',
    url: 'https://i.ibb.co/bgFMhr2B/Maplite-4096.webp',
  },
  {
    key: 'small',
    label: '高清',
    url: 'https://i.ibb.co/CKLKQQ4B/Maplite.webp',
  },
  {
    key: 'large',
    label: '超清',
    url: 'https://i.ibb.co/gMCpcFd8/Map-FULL.webp',
  },
];

const CACHE_NAME = 'destined-journey-cache-v1';
const MAP_LOAD_TIMEOUT_MS = 30000;

const mapContainer = ref<HTMLDivElement | null>(null);
const activeSourceKey = ref<MapSourceKey>('low');
const viewerStatus = ref<ViewerStatus>('loading');
const loadError = ref('');

let viewer: OpenSeadragon.Viewer | null = null;
let resizeObserver: ResizeObserver | null = null;
let abortController: AbortController | null = null;
let loadSequence = 0;
const objectUrls = new Map<MapSourceKey, string>();

const activeSource = computed(() => {
  return mapSources.find(source => source.key === activeSourceKey.value) ?? mapSources[0];
});

const setViewerError = (message: string) => {
  viewerStatus.value = 'error';
  loadError.value = message || '地图加载失败，请稍后重试';
};

const loadMap = async (sourceKey: MapSourceKey) => {
  if (!viewer) return;

  const source = mapSources.find(item => item.key === sourceKey);
  if (!source) return;

  const currentSequence = ++loadSequence;
  viewerStatus.value = 'loading';
  loadError.value = '';
  viewer.close();

  abortController?.abort();
  const controller = new AbortController();
  abortController = controller;

  const timeoutId = window.setTimeout(() => {
    controller.abort();
    if (currentSequence === loadSequence) {
      setViewerError('地图加载超时，请切换清晰度或稍后重试');
    }
  }, MAP_LOAD_TIMEOUT_MS);

  try {
    let objectUrl = objectUrls.get(sourceKey);

    if (!objectUrl) {
      let response: Response | undefined;

      if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        response = await cache.match(source.url);
      }

      if (!response) {
        response = await fetch(source.url, {
          mode: 'cors',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if ('caches' in window) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(source.url, response.clone());
        }
      }

      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);
      objectUrls.set(sourceKey, objectUrl);
    }

    if (controller.signal.aborted || currentSequence !== loadSequence || !viewer) return;

    const currentViewer = viewer;
    const handleOpen = () => {
      currentViewer.removeHandler('open', handleOpen);
      window.clearTimeout(timeoutId);

      if (currentSequence !== loadSequence) return;

      requestAnimationFrame(() => {
        if (!viewer || currentSequence !== loadSequence) return;
        viewer.forceResize();
        viewer.viewport.applyConstraints(true);
        viewerStatus.value = 'ready';
      });
    };

    currentViewer.addHandler('open', handleOpen);
    currentViewer.open({
      tileSource: new ImageTileSource({ url: objectUrl }),
    });
  } catch (error) {
    window.clearTimeout(timeoutId);
    if (controller.signal.aborted || currentSequence !== loadSequence) return;

    console.error('[StartLocationMap] 地图加载失败:', error);
    setViewerError(error instanceof Error ? error.message : '地图加载失败，请稍后重试');
  }
};

const handleSourceChange = (sourceKey: MapSourceKey) => {
  if (sourceKey === activeSourceKey.value && viewerStatus.value !== 'error') return;
  activeSourceKey.value = sourceKey;
  void loadMap(sourceKey);
};

const retryLoad = () => {
  void loadMap(activeSourceKey.value);
};

const openOriginalMap = () => {
  window.open(activeSource.value.url, '_blank', 'noopener,noreferrer');
};

onMounted(() => {
  if (!mapContainer.value) return;

  viewer = OpenSeadragon({
    element: mapContainer.value,
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

  viewer.addHandler('open-failed', event => {
    setViewerError(event?.message || '地图资源打开失败');
  });

  resizeObserver = new ResizeObserver(() => {
    if (!viewer || viewer.isDestroyed()) return;
    requestAnimationFrame(() => {
      if (!viewer || viewer.isDestroyed()) return;
      viewer.forceResize();
      viewer.viewport.applyConstraints(true);
    });
  });
  resizeObserver.observe(mapContainer.value);

  void loadMap(activeSourceKey.value);
});

onBeforeUnmount(() => {
  loadSequence++;
  abortController?.abort();
  resizeObserver?.disconnect();
  viewer?.destroy();
  viewer = null;
  objectUrls.forEach(url => URL.revokeObjectURL(url));
  objectUrls.clear();
});
</script>

<template>
  <section class="location-map" aria-label="世界地图">
    <div class="map-header">
      <div class="map-heading">
        <div class="map-title-row">
          <h3>世界地图</h3>
          <span v-if="selectedLocation" class="location-badge" :title="selectedLocation">
            {{ selectedLocation }}
          </span>
        </div>
        <p>拖动查看区域，滚轮或双击缩放；可结合地图确认上方选择的起始地点。</p>
      </div>

      <div class="map-actions">
        <div class="source-switch" aria-label="地图清晰度">
          <button
            v-for="source in mapSources"
            :key="source.key"
            type="button"
            :class="['source-button', { active: activeSourceKey === source.key }]"
            :aria-pressed="activeSourceKey === source.key"
            @click="handleSourceChange(source.key)"
          >
            {{ source.label }}
          </button>
        </div>
        <button type="button" class="original-button" @click="openOriginalMap">查看原图</button>
      </div>
    </div>

    <div class="map-frame">
      <div ref="mapContainer" class="map-viewer" />

      <div v-if="viewerStatus === 'loading'" class="map-placeholder" aria-live="polite">
        <span class="loading-ring" aria-hidden="true" />
        <span>地图加载中…</span>
      </div>

      <div v-else-if="viewerStatus === 'error'" class="map-placeholder error" role="alert">
        <span>{{ loadError }}</span>
        <button type="button" @click="retryLoad">重新加载</button>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.location-map {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--card-bg);
  overflow: hidden;
}

.map-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  background: rgba(255, 249, 240, 0.55);
}

.map-heading {
  min-width: 0;

  p {
    margin: 3px 0 0;
    color: var(--text-light);
    font-size: 0.82rem;
    line-height: 1.5;
  }
}

.map-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;

  h3 {
    margin: 0;
    font-size: 1.05rem;
    white-space: nowrap;
  }
}

.location-badge {
  max-width: min(460px, 48vw);
  padding: 2px var(--spacing-sm);
  border: 1px solid rgba(212, 175, 55, 0.45);
  border-radius: 999px;
  background: rgba(212, 175, 55, 0.12);
  color: var(--title-color);
  font-size: 0.75rem;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-actions,
.source-switch {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.source-switch {
  padding: 3px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--primary-bg);
}

.source-button,
.original-button,
.map-placeholder button {
  appearance: none;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-family: inherit;
  cursor: pointer;
  transition: var(--transition-fast);
}

.source-button {
  padding: 4px 9px;
  color: var(--text-light);
  background: transparent;
  font-size: 0.78rem;

  &:hover,
  &:focus-visible {
    color: var(--title-color);
    background: rgba(212, 175, 55, 0.12);
  }

  &.active {
    color: var(--primary-bg);
    background: var(--accent-color);
    font-weight: 600;
  }
}

.original-button,
.map-placeholder button {
  padding: 6px 10px;
  border-color: var(--border-color-strong);
  color: var(--title-color);
  background: var(--input-bg);
  font-size: 0.78rem;

  &:hover,
  &:focus-visible {
    border-color: var(--accent-color);
    background: rgba(212, 175, 55, 0.14);
  }
}

.map-frame {
  position: relative;
  height: clamp(320px, 48vh, 580px);
  min-height: 320px;
  background: radial-gradient(circle at center, rgba(212, 175, 55, 0.08), transparent 58%), #28241f;
  overflow: hidden;
}

.map-viewer {
  width: 100%;
  height: 100%;
}

.map-placeholder {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  color: #f5efe6;
  background: rgba(40, 36, 31, 0.92);
  font-size: 0.9rem;

  &.error {
    flex-direction: column;
    padding: var(--spacing-lg);
    color: #ffd2d2;
    text-align: center;
  }
}

.loading-ring {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(245, 239, 230, 0.28);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: map-loading 0.8s linear infinite;
}

@keyframes map-loading {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .map-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
  }

  .map-actions {
    width: 100%;
    justify-content: space-between;
  }

  .map-frame {
    height: min(54vw, 360px);
    min-height: 250px;
  }
}

@media (max-width: 480px) {
  .map-title-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .location-badge {
    max-width: 100%;
  }

  .map-actions {
    align-items: stretch;
  }

  .source-switch {
    flex: 1;
  }

  .source-button {
    flex: 1;
    padding-inline: 5px;
  }

  .map-frame {
    height: 250px;
    min-height: 250px;
  }
}
</style>
