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
        我已同意<a class="agreement-link" @click.stop.prevent="showAgreementModal = true"
          >最终用户许可协议</a
        >
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
          <h3 class="modal-title">最终用户许可协议</h3>
          <div class="modal-scroll-body">
            <h4>一、总则</h4>
            <p>
              欢迎使用「命定之诗与黄昏之歌」（以下简称"本项目"）。本项目是一款基于 SillyTavern
              平台的互动叙事/角色扮演创作内容集合，包含但不限于角色卡、世界书、前端界面及相关脚本工具。
            </p>
            <p>
              在使用本项目前，请您仔细阅读并充分理解本协议的各项条款。当您点击"同意"或以其他方式确认接受本协议时，即视为您已阅读、理解并同意受本协议的约束。
            </p>
            <p>本项目免费提供。</p>
            <h4>二、知识产权</h4>
            <ul>
              <li>
                本项目中的<strong>原创文本、角色设定、世界观设计、美术素材及代码</strong>等内容的知识产权归属于本项目制作团队。
              </li>
              <li>本项目可能包含第三方开源组件或素材，其各自遵循相应的开源许可协议。</li>
              <li>您不得将本项目的任何内容用于<strong>任何商业用途</strong>。</li>
            </ul>

            <h4>三、使用规范</h4>
            <ul>
              <li>本项目仅供<strong>个人学习、娱乐和非商业性质的交流</strong>使用。</li>
              <li>
                您不得对本项目进行反编译、逆向工程或以任何方式试图提取源代码（已公开部分除外）。
              </li>
              <li>您不得将本项目内容进行二次分发、转售或制作衍生商品。</li>
              <li>您不得在墙内社区、QQ群传播、讨论相关内容。</li>
              <li>
                在公开场合分享您使用本项目的体验或成果时，请<strong>注明出处</strong>并尊重制作团队的劳动成果。
              </li>
            </ul>

            <h4>四、免责声明</h4>
            <ul>
              <li>
                本项目按<strong>"现状"</strong>提供，制作团队不对其适用性、完整性或无错误性作任何明示或暗示的保证。
              </li>
              <li>
                因用户自身环境配置、网络状况或不当操作导致的任何问题，制作团队<strong>不承担责任</strong>。
              </li>
              <li>
                本项目生成的文本内容由 AI 模型产出，制作团队对 AI
                生成的具体内容<strong>不承担审核义务与法律责任</strong>。
              </li>
              <li>用户应自行判断 AI 生成内容的合理性与适当性，并对自己的使用行为负责。</li>
            </ul>

            <h4>五、隐私与数据</h4>
            <ul>
              <li>
                本项目运行于用户本地环境，<strong>不会主动收集、上传或存储</strong>您的任何个人数据。
              </li>
              <li>
                与 AI 服务的通信由您自行配置的 API 完成，相关数据处理遵循对应
                AI服务提供商的隐私政策。
              </li>
            </ul>

            <h4>六、协议变更</h4>
            <p>
              制作团队保留随时修改本协议的权利。协议变更后，继续使用本项目即视为您接受修改后的协议内容。重大变更将通过更新公告等方式通知用户。
            </p>

            <h4>七、其他</h4>
            <ul>
              <li>本协议的解释权归本项目制作团队所有。</li>
              <li>若本协议中的任何条款被认定为无效或不可执行，其余条款仍然有效。</li>
              <li>如有任何疑问，请通过项目官方渠道联系制作团队。</li>
              <li>
                依据您行为的严重性，制作组可以自行决定您死后是否转世到战锤40000世界，永世为帝皇奉献自己的价值。
              </li>
            </ul>
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
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue';
import { initialEnvStatus, performFullEnvCheck } from '../services/envCheck';

const emit = defineEmits(['agreed', 'envCheckComplete']);

// 是否为回访用户（曾同意过协议）
const previouslyAgreed = inject<boolean>('previouslyAgreed', false);

const flavorTexts = [
  '黄昏将至，旅人，你的笔墨已备好',
  '酒馆的炉火正旺，今夜的诗篇将由谁来谱写？',
  '星辰隐没于字里行间，命运的齿轮开始转动',
  '听，风中传来了远古的歌谣...',
  '在日与夜的交界处，寻找属于你的故事',
  '命运的诗篇，往往从一次微不足道的停顿开始',
  'H一串说：命一串其实是战锤世界观，因为488年开局的两个8横过来就是40k',
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
const isAgreed = ref(previouslyAgreed ? true : false);
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
  // 回访用户跳过检查后直接自动跳转
  if (previouslyAgreed) {
    emit('agreed');
  }
}

function toggleAgreed() {
  isAgreed.value = !isAgreed.value;
}

function handleContinue() {
  if (canContinue.value) {
    emit('agreed');
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

// 回访用户：环境通过后自动跳转
watch(envPassed, passed => {
  if (passed && previouslyAgreed) {
    emit('agreed');
  }
});

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
