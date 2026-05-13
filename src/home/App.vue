<template>
  <div class="selector-scroll">
    <PageTitle />

    <Transition name="fade" mode="out-in">
      <!-- Gate 阶段：用户协议页面 -->
      <AgreementPage
        v-if="!hasAgreed"
        key="agreement"
        @agreed="handleAgreed"
        @env-check-complete="handleEnvCheckComplete"
      />

      <!-- 正常阶段：展示区 + 步骤流程 -->
      <div v-else key="main">
        <ShowcaseSection />

        <div class="step-content">
          <Transition name="fade" mode="out-in">
            <component
              :is="steps[currentStep]"
              @next="nextStep"
              @prev="prevStep"
              @env-check-complete="handleEnvCheckComplete"
            />
          </Transition>
        </div>
      </div>
    </Transition>
  </div>

  <!-- 悬浮音乐播放器，同意协议后显示 -->
  <VinylPlayer v-if="hasAgreed" />
</template>

<script setup>
import { provide, readonly, ref } from 'vue';
import AgreementPage from './components/AgreementPage.vue';
import CorePage from './components/CorePage.vue';
import DLCManagementPage from './components/DLCManagementPage.vue';
import PageTitle from './components/PageTitle.vue';
import ShowcaseSection from './components/ShowcaseSection.vue';
import VinylPlayer from './components/VinylPlayer.vue';

import StartPage from './components/StartPage.vue';

const AGREEMENT_KEY = 'destined-journey-agreed';
const AGREEMENT_EXPIRE_MS = 14 * 24 * 60 * 60 * 1000; // 14 天

// 用户协议 Gate
const hasAgreed = ref(false);

function handleAgreed() {
  hasAgreed.value = true;
  // 写入同意时间戳
  try {
    localStorage.setItem(AGREEMENT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

const currentStep = ref(0);

const steps = [DLCManagementPage, CorePage, StartPage];

// 环境检查结果
const envCheckResult = ref(null);

// 提供给子组件使用
provide('envCheckResult', readonly(envCheckResult));

// 检查是否曾同意过协议且未过期（14天）
function hasPreviouslyAgreed() {
  try {
    const ts = localStorage.getItem(AGREEMENT_KEY);
    if (!ts) return false;
    const elapsed = Date.now() - Number(ts);
    return elapsed >= 0 && elapsed < AGREEMENT_EXPIRE_MS;
  } catch {
    return false;
  }
}

// 将曾同意标识提供给 AgreementPage 使用
const previouslyAgreed = hasPreviouslyAgreed();
provide('previouslyAgreed', previouslyAgreed);

function nextStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

function handleEnvCheckComplete(result) {
  envCheckResult.value = result;
}
</script>

<style scoped>
.selector-scroll {
  background-color: #f5efe6;
  max-width: 900px;
  width: 100%;
  margin: auto;
  display: flex;
  flex-direction: column;
}

.step-content {
  margin-top: 20px;
}
</style>
