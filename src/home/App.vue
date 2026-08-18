<template>
  <div class="selector-scroll">
    <PageTitle />

    <Transition name="fade" mode="out-in">
      <!-- Gate 阶段：用户协议页面 -->
      <div v-if="isAgreementLoading" key="agreement-loading" class="agreement-load-state">
        正在加载使用协议...
      </div>

      <div v-else-if="agreementLoadError" key="agreement-error" class="agreement-load-state error">
        <span>{{ agreementLoadError }}</span>
        <button type="button" @click="loadCurrentAgreement">重新加载</button>
      </div>

      <AgreementPage
        v-else-if="!hasAgreed && agreement"
        key="agreement"
        :agreement="agreement"
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

<script setup lang="ts">
import { onMounted, provide, readonly, ref } from 'vue';
import AgreementPage from './components/AgreementPage.vue';
import CorePage from './components/CorePage.vue';
import DLCManagementPage from './components/DLCManagementPage.vue';
import PageTitle from './components/PageTitle.vue';
import ShowcaseSection from './components/ShowcaseSection.vue';
import VinylPlayer from './components/VinylPlayer.vue';
import {
  hasAcceptedAgreement,
  loadAgreement,
  saveAcceptedAgreement,
  type AgreementDocument,
} from './services/agreement';

import StartPage from './components/StartPage.vue';

// 用户协议 Gate
const hasAgreed = ref(false);
const agreement = ref<AgreementDocument | null>(null);
const isAgreementLoading = ref(true);
const agreementLoadError = ref('');

function handleAgreed(version: string) {
  if (!agreement.value || version !== agreement.value.version) return;

  hasAgreed.value = true;
  saveAcceptedAgreement(version);
}

const currentStep = ref(0);

const steps = [DLCManagementPage, CorePage, StartPage];

// 环境检查结果
const envCheckResult = ref<unknown>(null);

// 提供给子组件使用
provide('envCheckResult', readonly(envCheckResult));

async function loadCurrentAgreement() {
  isAgreementLoading.value = true;
  agreementLoadError.value = '';

  try {
    const document = await loadAgreement();
    agreement.value = document;
    hasAgreed.value = hasAcceptedAgreement(document.version);
  } catch (error) {
    agreement.value = null;
    hasAgreed.value = false;
    agreementLoadError.value = error instanceof Error ? error.message : '协议加载失败';
  } finally {
    isAgreementLoading.value = false;
  }
}

onMounted(() => {
  loadCurrentAgreement();
});

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

function handleEnvCheckComplete(result: unknown) {
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

.agreement-load-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 240px;
  color: var(--text-color);
}

.agreement-load-state.error {
  color: #a33a32;
}

.agreement-load-state button {
  font-family: var(--body-font);
  color: #fff;
  background: var(--title-color);
  border: 1px solid var(--border-strong-color);
  border-radius: 6px;
  padding: 7px 14px;
  cursor: pointer;
}
</style>
