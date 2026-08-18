<template>
  <div class="agreement-page">
    <!-- 环境检查区域 -->
    <h2 class="section-heading">环境检查</h2>
    <div class="env-check-container">
      <!-- 酒馆助手 -->
      <div class="env-check-item">
        <div class="env-check-label">
          <span class="icon">⚙️</span>
          <span>酒馆助手</span>
        </div>
        <div class="env-check-details">
          <span
            >版本:
            <strong :class="'status-' + (envStatus.tavernHelper.version ? 'ok' : 'unknown')">
              {{ envStatus.tavernHelper.version || '未知' }}
            </strong></span
          >
          <span
            >状态:
            <strong :class="'status-' + envStatus.tavernHelper.status">
              {{ envStatus.tavernHelper.statusText }}
            </strong></span
          >
        </div>
      </div>

      <!-- 提示词模板 (EJS) -->
      <div class="env-check-item">
        <div class="env-check-label">
          <span class="icon">📄</span>
          <span>提示词模板 (EJS)</span>
        </div>
        <div class="env-check-details">
          <span
            >状态:
            <strong :class="'status-' + envStatus.ejsTemplate.status">
              {{ envStatus.ejsTemplate.statusText }}
            </strong></span
          >
          <span
            >启用?:
            <strong :class="'status-' + envStatus.ejsTemplate.enabledStatus">
              {{ envStatus.ejsTemplate.enabledText }}
            </strong></span
          >
        </div>
      </div>

      <!-- MVU 框架 -->
      <div class="env-check-item">
        <div class="env-check-label">
          <span class="icon">🧩</span>
          <span>MVU 框架</span>
        </div>
        <div class="env-check-details">
          <span
            >状态:
            <strong :class="'status-' + envStatus.mvu.status">
              {{ envStatus.mvu.statusText }}
            </strong></span
          >
        </div>
      </div>

      <div class="recheck-container">
        <button class="recheck-button" :disabled="isChecking" @click="handleRecheck">
          {{ isChecking ? '检查中...' : '重新检查' }}
        </button>
        <button v-if="canSkip" class="skip-button" @click="showSkipConfirm = true">跳过检查</button>
      </div>
    </div>

    <!-- 继续按钮 -->
    <div class="agreement-action">
      <button class="agree-button" :disabled="!canContinue" @click="handleContinue">继续</button>
    </div>

    <!-- 协议勾选 -->
    <div class="agreement-checkbox-row" @click.prevent="toggleAgreed">
      <span class="custom-checkbox" :class="{ checked: isAgreed }">
        <span v-if="isAgreed" class="check-mark">✓</span>
      </span>
      <span class="agreement-text">
        我已同意<a class="agreement-link" @click.stop.prevent="showAgreementModal = true">{{
          agreement.title
        }}</a>
      </span>
    </div>

    <div class="flavor-text-container">
      <p class="flavor-text" :class="{ 'flavor-fading': isFlavorFading }">
        “ {{ currentFlavorText }} ”
      </p>
    </div>

    <!-- 用户协议弹窗 -->
    <transition name="fade">
      <div v-if="showAgreementModal" class="modal-overlay" @click.self="showAgreementModal = false">
        <div class="modal-content agreement-modal">
          <h3 class="modal-title">{{ agreement.title }}</h3>
          <div class="agreement-version">协议版本：{{ agreement.version }}</div>
          <div class="modal-scroll-body">
            <section v-for="section in agreement.sections" :key="section.title">
              <h4>{{ section.title }}</h4>
              <p v-for="paragraph in section.paragraphs || []" :key="paragraph">
                {{ paragraph }}
              </p>
              <ul v-if="section.items?.length">
                <li v-for="item in section.items" :key="item">{{ item }}</li>
              </ul>
            </section>
          </div>
          <div class="modal-actions">
            <button class="modal-btn modal-btn-close" @click="showAgreementModal = false">
              关闭
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 跳过环境检查确认弹窗 -->
    <transition name="fade">
      <div v-if="showSkipConfirm" class="modal-overlay" @click.self="showSkipConfirm = false">
        <div class="modal-content">
          <h3 class="modal-title">⚠️ 跳过环境检查</h3>
          <div class="modal-body">
            <p>您即将跳过环境检查，请仔细阅读并确认以下内容：</p>
            <ul class="modal-list">
              <li>我已确认当前运行环境中所有组件均<strong>无异常</strong></li>
              <li>我了解跳过环境检查可能导致后续功能<strong>无法正常使用</strong></li>
              <li>若因环境问题导致的任何异常，<strong>作者不承担任何责任</strong></li>
            </ul>
          </div>
          <div class="modal-actions">
            <button class="modal-btn modal-btn-cancel" @click="showSkipConfirm = false">
              取消
            </button>
            <button class="modal-btn modal-btn-confirm" @click="confirmSkip">确认跳过</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { initialEnvStatus, performFullEnvCheck } from '../services/envCheck';
import type { AgreementDocument } from '../services/agreement';

const props = defineProps<{
  agreement: AgreementDocument;
}>();

const emit = defineEmits<{
  agreed: [version: string];
  envCheckComplete: [result: typeof initialEnvStatus];
}>();

const flavorTexts = [
  '黄昏将至，旅人，你的笔墨已备好',
  '酒馆的炉火正旺，今夜的诗篇将由谁来谱写？',
  '星辰隐没于字里行间，命运的齿轮开始转动',
  '听，风中传来了远古的歌谣...',
  '在日与夜的交界处，寻找属于你的故事',
  '命运的诗篇，往往从一次微不足道的停顿开始',
  '命一串其实是战锤世界观，因为488年开局的两个8横过来就是40k',
  '极其极其极其极其极其极其极其极其极其极其',
  '由于由于由于由于由于由于由于由于由于由于由于',
];
let flavorIndex = Math.floor(Math.random() * flavorTexts.length);
const currentFlavorText = ref(flavorTexts[flavorIndex]);
const isFlavorFading = ref(false);
let flavorTimer: ReturnType<typeof setInterval> | null = null;

// 环境检查相关
const isChecking = ref(false);
const recheckCount = ref(0);
const showSkipConfirm = ref(false);
const envStatus = ref({ ...initialEnvStatus });
const envPassed = ref(false);

// 用户协议相关
const isAgreed = ref(false);
const showAgreementModal = ref(false);

/** 重新检查3次仍未通过时，允许跳过 */
const canSkip = computed(() => {
  return recheckCount.value >= 3 && !envStatus.value.allOk && !isChecking.value;
});

/** 环境检查通过（或已跳过）且已同意协议时可以继续 */
const canContinue = computed(() => {
  return envPassed.value && isAgreed.value;
});

async function performCheck() {
  isChecking.value = true;

  try {
    const result = await performFullEnvCheck();
    envStatus.value = result;
    emit('envCheckComplete', result);

    if (result.allOk) {
      envPassed.value = true;
    }
  } catch (error) {
    console.error('环境检查失败:', error);
  } finally {
    isChecking.value = false;
  }
}

/** 手动重新检查，累加计数 */
function handleRecheck() {
  recheckCount.value++;
  performCheck();
}

/** 确认跳过环境检查 */
function confirmSkip() {
  showSkipConfirm.value = false;
  envPassed.value = true;
  if (isAgreed.value) {
    emit('agreed', props.agreement.version);
  }
}

function toggleAgreed() {
  isAgreed.value = !isAgreed.value;
}

function handleContinue() {
  if (canContinue.value) {
    emit('agreed', props.agreement.version);
  }
}

// 监听环境检查状态
watch(
  () => envStatus.value.allOk,
  allOk => {
    if (allOk && !isChecking.value) {
      envPassed.value = true;
    }
  },
);

onMounted(() => {
  performCheck();
  flavorTimer = setInterval(() => {
    // 先淡出
    isFlavorFading.value = true;
    setTimeout(() => {
      // 淡出完成后切换文本
      flavorIndex = (flavorIndex + 1) % flavorTexts.length;
      currentFlavorText.value = flavorTexts[flavorIndex];
      // 再淡入
      isFlavorFading.value = false;
    }, 600);
  }, 5000);
});

onUnmounted(() => {
  if (flavorTimer) {
    clearInterval(flavorTimer);
    flavorTimer = null;
  }
});
</script>

<style scoped>
.agreement-page {
  max-width: 900px;
  width: 100%;
  margin: auto;
}

/* 区域标题 */
.section-heading {
  font-family: var(--title-font);
  font-weight: 700;
  color: var(--title-color);
  text-align: center;
  margin: 0 0 10px 0;
  font-size: 2.2em;
}

/* 环境检查容器  */
.env-check-container {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: rgba(253, 250, 245, 0.9);
  padding: 10px 20px;
  margin: 25px auto;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  max-width: 440px;
  width: 100%;
}

.env-check-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 5px;
  flex-wrap: wrap;
  gap: 10px;
}

.env-check-item:not(:last-child) {
  border-bottom: 1px dashed var(--border-color);
}

.env-check-label {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: var(--title-color);
}

.env-check-label .icon {
  font-size: 1.4em;
  margin-right: 12px;
  opacity: 0.8;
  line-height: 1;
}

.env-check-details {
  display: flex;
  align-items: center;
  font-size: 0.9em;
  gap: 15px;
  text-align: right;
}

.env-check-details strong {
  font-weight: 700;
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  min-width: 55px;
  text-align: center;
  border: 1px solid transparent;
}

.recheck-container {
  text-align: center;
  margin: 15px 0 0 0;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.recheck-button {
  font-family: var(--body-font);
  font-weight: 500;
  font-size: 1em;
  color: var(--title-color);
  background-color: var(--item-bg-color);
  border: 1px solid var(--border-color);
  padding: 8px 25px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.recheck-button:hover:not(:disabled) {
  background-color: var(--item-bg-hover-color);
  border-color: var(--border-strong-color);
}

.recheck-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.skip-button {
  font-family: var(--body-font);
  font-weight: 500;
  font-size: 1em;
  color: #856404;
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  padding: 8px 25px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.skip-button:hover {
  background-color: #ffe69c;
  border-color: #e0a800;
}

.success-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  margin-top: 0;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 6px;
  color: #155724;
  font-weight: 500;
}

.success-icon {
  font-size: 1.2em;
}

/* 继续按钮 */
.agreement-action {
  text-align: center;
  margin: 20px 0 0 0;
}

.agree-button {
  font-family: var(--body-font);
  font-weight: 600;
  font-size: 1.1em;
  color: #fff;
  background-color: var(--title-color);
  border: 1px solid var(--border-strong-color);
  padding: 12px 50px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  letter-spacing: 2px;
}

.agree-button:hover:not(:disabled) {
  background-color: var(--border-strong-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.agree-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: #a89080;
  border-color: var(--border-color);
}

/* 协议复选框行（在按钮下方） */
.agreement-checkbox-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 16px 0 20px 0;
  cursor: pointer;
  user-select: none;
  font-size: 0.95em;
  color: var(--text-color);
}

.agreement-checkbox-row:hover .custom-checkbox:not(.checked) {
  border-color: var(--border-strong-color);
}

.custom-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--item-bg-color);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.custom-checkbox.checked {
  background-color: var(--title-color);
  border-color: var(--title-color);
}

.check-mark {
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.agreement-text {
  line-height: 1.4;
}

.agreement-link {
  color: var(--link-color);
  text-decoration: underline;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.2s ease;
}

.agreement-link:hover {
  color: var(--title-color);
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background-color: #fffdf7;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 24px 28px;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.agreement-modal {
  max-width: 600px;
}

.agreement-version {
  margin: -10px 0 14px;
  color: var(--link-color);
  font-size: 0.82em;
  text-align: center;
}

.modal-title {
  font-family: var(--title-font);
  font-weight: 700;
  color: var(--title-color);
  margin: 0 0 16px 0;
  font-size: 1.3em;
  text-align: center;
}

.modal-scroll-body {
  max-height: 400px;
  overflow-y: auto;
  font-size: 0.92em;
  color: var(--text-color, #333);
  line-height: 1.7;
  padding-right: 5px;
}

.modal-scroll-body h4 {
  font-family: var(--title-font);
  color: var(--title-color);
  margin: 16px 0 8px 0;
  font-size: 1.05em;
  border-bottom: 1px dashed var(--border-color);
  padding-bottom: 4px;
}

.modal-scroll-body h4:first-child {
  margin-top: 0;
}

.modal-scroll-body p {
  margin: 0 0 8px 0;
}

.modal-scroll-body ul {
  margin: 0 0 8px 0;
  padding-left: 20px;
}

.modal-scroll-body li {
  margin-bottom: 5px;
}

.modal-scroll-body li strong {
  color: #c0392b;
}

.modal-scroll-body::-webkit-scrollbar {
  width: 5px;
}

.modal-scroll-body::-webkit-scrollbar-track {
  background: transparent;
}

.modal-scroll-body::-webkit-scrollbar-thumb {
  background-color: var(--border-color);
  border-radius: 3px;
}

.modal-body {
  font-size: 0.95em;
  color: var(--text-color, #333);
  line-height: 1.6;
}

.modal-body p {
  margin: 0 0 10px 0;
}

.modal-list {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.modal-list li {
  margin-bottom: 8px;
}

.modal-list li strong {
  color: #c0392b;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.modal-btn {
  font-family: var(--body-font);
  font-weight: 500;
  font-size: 0.95em;
  padding: 8px 22px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: 1px solid transparent;
}

.modal-btn-close {
  color: var(--title-color);
  background-color: var(--item-bg-color, #f0f0f0);
  border-color: var(--border-color, #ccc);
}

.modal-btn-close:hover {
  background-color: var(--item-bg-hover-color, #e0e0e0);
}

.modal-btn-cancel {
  color: var(--title-color);
  background-color: var(--item-bg-color, #f0f0f0);
  border-color: var(--border-color, #ccc);
}

.modal-btn-cancel:hover {
  background-color: var(--item-bg-hover-color, #e0e0e0);
}

.modal-btn-confirm {
  color: #fff;
  background-color: #e67e22;
  border-color: #d35400;
}

.modal-btn-confirm:hover {
  background-color: #d35400;
}

/* 淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.flavor-text-container {
  text-align: center;
  margin-top: 45px; /* 与上方的功能区拉开较大距离，利用空白 */
  margin-bottom: 20px;
  padding: 0 20px;
  opacity: 0.8; /* 整体轻微透明，不抢焦点 */
}

.flavor-text {
  font-family:
    'Palatino Linotype', 'Book Antiqua', 'KaiTi', '楷体', serif; /* 优先使用优雅的衬线体/楷体 */
  font-style: italic; /* 斜体强调诗意 */
  font-size: 0.95em;
  color: #9d8873; /* 一种偏灰的褐色，仿佛褪色的墨迹 */
  letter-spacing: 2px; /* 增加字间距，让阅读节奏慢下来 */
  margin: 0;
  transition: opacity 0.6s ease;
}

.flavor-text.flavor-fading {
  opacity: 0;
}

/* 响应式 */
@media screen and (max-width: 600px) {
  .section-heading {
    font-size: 1.8em;
  }

  .agree-button {
    padding: 10px 35px;
    font-size: 1em;
  }

  .modal-scroll-body {
    max-height: 300px;
  }
}
</style>
