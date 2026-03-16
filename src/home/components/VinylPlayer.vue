<template>
  <div
    ref="floatEl"
    class="vinyl-float"
    :class="{ collapsed: isCollapsed, dragging: isDragging }"
    :style="floatStyle"
  >
    <!-- 折叠态：只显示一个小唱片图标 -->
    <button
      v-if="isCollapsed"
      class="vinyl-toggle"
      title="展开留声机"
      @pointerdown.prevent="onDragStart"
      @click="handleToggleClick"
    >
      <span class="mini-disc" :class="{ spinning: isPlaying }"
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M6 12c0-1.7.7-3.2 1.8-4.2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M18 12c0 1.7-.7 3.2-1.8 4.2" /></svg
      ></span>
    </button>

    <!-- 展开态 -->
    <div v-else class="vinyl-panel">
      <div class="panel-header" @pointerdown.prevent="onDragStart">
        <span class="panel-title">♫ 留声机</span>
        <button class="collapse-btn" title="收起" @click.stop="isCollapsed = true">✕</button>
      </div>

      <!-- 迷你唱片机 -->
      <div class="mini-turntable">
        <div class="mini-base">
          <!-- 唱片 -->
          <div class="mini-platter">
            <div class="mini-vinyl" :class="{ spinning: isPlaying }">
              <div class="mini-groove mini-g1"></div>
              <div class="mini-groove mini-g2"></div>
              <div class="mini-groove mini-g3"></div>
              <div class="mini-center">
                <div class="center-hole"></div>
              </div>
            </div>
          </div>
          <!-- 唱针 -->
          <div class="mini-arm-pivot"></div>
          <div class="mini-arm" :class="{ 'on-record': isPlaying }">
            <div class="mini-arm-bar"></div>
            <div class="mini-arm-head"></div>
          </div>
        </div>
      </div>

      <!-- 曲目名 -->
      <div class="track-name">{{ currentTrack.name }}</div>

      <!-- 控制按钮 -->
      <div class="player-controls">
        <button class="ctrl-btn" title="上一首" @click="prevTrack">⏮</button>
        <button class="ctrl-btn play-btn" :title="isPlaying ? '暂停' : '播放'" @click="togglePlay">
          {{ isPlaying ? '⏸' : '▶' }}
        </button>
        <button class="ctrl-btn" title="下一首" @click="nextTrack">⏭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

interface Track {
  name: string;
  url: string;
}

const tracks: Track[] = [
  { name: '第一乐章', url: 'https://files.catbox.moe/scmu3o.mp3' },
  { name: '第二乐章', url: 'https://files.catbox.moe/3df28k.mp3' },
  { name: '第三乐章', url: 'https://files.catbox.moe/3lrlbi.mp3' },
];

const currentIndex = ref(0);
const isPlaying = ref(false);
const isCollapsed = ref(true);
const currentTrack = ref<Track>(tracks[0]);

// ========== 拖拽逻辑 ==========
const floatEl = ref<HTMLElement | null>(null);
const posRight = ref(24);
const posTop = ref(24);
const isDragging = ref(false);
let dragStartX = 0;
let dragStartY = 0;
let dragStartRight = 0;
let dragStartTop = 0;
let hasMoved = false;

const floatStyle = computed(() => ({
  right: `${posRight.value}px`,
  top: `${posTop.value}px`,
}));

function onDragStart(e: PointerEvent) {
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragStartRight = posRight.value;
  dragStartTop = posTop.value;
  hasMoved = false;
  document.addEventListener('pointermove', onDragMove);
  document.addEventListener('pointerup', onDragEnd);
}

function onDragMove(e: PointerEvent) {
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

  // 移动超过 4px 才视为拖拽
  if (!hasMoved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
  hasMoved = true;
  isDragging.value = true;

  const el = floatEl.value;
  if (!el) return;
  const elW = el.offsetWidth;
  const elH = el.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // right 向左为正，所以 dx 取反；top 向下为正
  let newRight = dragStartRight - dx;
  let newTop = dragStartTop + dy;

  // 限制在视口内
  newRight = Math.max(0, Math.min(newRight, vw - elW));
  newTop = Math.max(0, Math.min(newTop, vh - elH));

  posRight.value = newRight;
  posTop.value = newTop;
}

function onDragEnd() {
  document.removeEventListener('pointermove', onDragMove);
  document.removeEventListener('pointerup', onDragEnd);
  // 延迟重置以防 click 事件误触发
  setTimeout(() => {
    isDragging.value = false;
  }, 0);
}

function handleToggleClick() {
  if (!hasMoved) {
    isCollapsed.value = false;
    clampToViewport();
  }
}

// 展开后确保面板不超出视口
function clampToViewport() {
  nextTick(() => {
    const el = floatEl.value;
    if (!el) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const elW = el.offsetWidth;
    const elH = el.offsetHeight;

    if (posRight.value + elW > vw) {
      posRight.value = Math.max(0, vw - elW);
    }
    if (posTop.value + elH > vh) {
      posTop.value = Math.max(0, vh - elH);
    }
  });
}

let audio: HTMLAudioElement | null = null;

function createAudio() {
  if (audio) {
    audio.pause();
    audio.removeEventListener('ended', handleEnded);
  }
  audio = new Audio(currentTrack.value.url);
  audio.volume = 0.3;
  audio.addEventListener('ended', handleEnded);
}

// ========== 点击外部收起 ==========
function onDocumentClick(e: PointerEvent) {
  if (isCollapsed.value) return;
  const el = floatEl.value;
  if (el && !el.contains(e.target as Node)) {
    isCollapsed.value = true;
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentClick, true);
});

function handleEnded() {
  currentIndex.value = (currentIndex.value + 1) % tracks.length;
}

function togglePlay() {
  if (!audio) {
    createAudio();
  }
  if (isPlaying.value) {
    audio?.pause();
    isPlaying.value = false;
  } else {
    audio?.play();
    isPlaying.value = true;
  }
}

function nextTrack() {
  currentIndex.value = (currentIndex.value + 1) % tracks.length;
}

function prevTrack() {
  currentIndex.value = (currentIndex.value - 1 + tracks.length) % tracks.length;
}

watch(currentIndex, newIdx => {
  const wasPlaying = isPlaying.value;
  currentTrack.value = tracks[newIdx];
  createAudio();
  if (wasPlaying && audio) {
    audio.play();
    isPlaying.value = true;
  }
});

onBeforeUnmount(() => {
  if (audio) {
    audio.pause();
    audio.removeEventListener('ended', handleEnded);
    audio = null;
  }
  document.removeEventListener('pointermove', onDragMove);
  document.removeEventListener('pointerup', onDragEnd);
  document.removeEventListener('pointerdown', onDocumentClick, true);
});
</script>

<style scoped>
/* ========== 悬浮容器 ========== */
.vinyl-float {
  position: fixed;
  z-index: 9999;
  font-family: var(--body-font);
  touch-action: none;
  user-select: none;
}

.vinyl-float.dragging {
  cursor: grabbing;
}

/* 折叠按钮 */
.vinyl-toggle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--border-strong-color);
  background: linear-gradient(145deg, #6b4a3a, #4a3228);
  box-shadow: 0 4px 14px rgba(61, 41, 32, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  transition: all 0.25s ease;
  padding: 0;
}

.vinyl-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 18px rgba(61, 41, 32, 0.6);
}

.mini-disc {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  color: #d4b896;
}

.mini-disc.spinning {
  animation: spin-record 2s linear infinite;
}

/* ========== 展开面板 ========== */
.vinyl-panel {
  width: 200px;
  background: linear-gradient(145deg, #6b4a3a 0%, #4a3228 50%, #3d2920 100%);
  border-radius: 14px;
  box-shadow:
    0 8px 28px rgba(61, 41, 32, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.panel-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: grab;
}

.panel-header:active {
  cursor: grabbing;
}

.panel-title {
  font-family: var(--title-font);
  font-weight: 700;
  color: #d4b896;
  font-size: 0.85em;
  letter-spacing: 1.5px;
}

.collapse-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid rgba(212, 184, 150, 0.3);
  background: rgba(255, 255, 255, 0.08);
  color: #d4b896;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(212, 184, 150, 0.6);
}

/* ========== 迷你唱片机 ========== */
.mini-turntable {
  width: 100%;
  display: flex;
  justify-content: center;
}

.mini-base {
  position: relative;
  width: 130px;
  height: 110px;
  background: linear-gradient(160deg, #5a3d30 0%, #3d2920 100%);
  border-radius: 8px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  padding-left: 10px;
}

.mini-platter {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: radial-gradient(circle, #444 0%, #383838 100%);
  box-shadow:
    0 0 0 2px #333,
    0 1px 5px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mini-vinyl {
  position: relative;
  width: 82px;
  height: 82px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #1a1a1a 0%,
    #111 25%,
    #1a1a1a 26%,
    #0d0d0d 50%,
    #1a1a1a 51%,
    #111 75%,
    #1a1a1a 76%,
    #0d0d0d 100%
  );
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-vinyl.spinning {
  animation: spin-record 3s linear infinite;
}

@keyframes spin-record {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.mini-groove {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.035);
  pointer-events: none;
}

.mini-g1 {
  width: 88%;
  height: 88%;
}
.mini-g2 {
  width: 68%;
  height: 68%;
}
.mini-g3 {
  width: 48%;
  height: 48%;
}

.mini-center {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: radial-gradient(circle, #d4a574 0%, #a87c54 100%);
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.center-hole {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #1a1a1a;
}

/* 唱针 */
.mini-arm-pivot {
  position: absolute;
  top: 10px;
  right: 14px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle, #e8d5b8, #8b7355);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  z-index: 5;
}

.mini-arm {
  position: absolute;
  top: 14px;
  right: 18px;
  transform-origin: 0 0;
  transform: rotate(15deg);
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

.mini-arm.on-record {
  transform: rotate(36deg);
}

.mini-arm-bar {
  width: 60px;
  height: 2.5px;
  background: linear-gradient(180deg, #d4b896, #8b7355);
  border-radius: 1px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
}

.mini-arm-head {
  position: absolute;
  right: -7px;
  top: -2px;
  width: 7px;
  height: 7px;
  background: linear-gradient(180deg, #bbb, #888);
  border-radius: 1px;
}

/* ========== 曲目名 ========== */
.track-name {
  color: #d4b896;
  font-size: 0.8em;
  text-align: center;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  letter-spacing: 0.5px;
}

/* ========== 控制按钮 ========== */
.player-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid rgba(212, 184, 150, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: #d4b896;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  font-size: 12px;
}

.ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(212, 184, 150, 0.6);
  transform: translateY(-1px);
}

.ctrl-btn:active {
  transform: translateY(0);
}

.play-btn {
  width: 36px;
  height: 36px;
  font-size: 14px;
  border-width: 2px;
  border-color: rgba(212, 184, 150, 0.5);
}
</style>
