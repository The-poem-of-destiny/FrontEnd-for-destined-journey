/**
 * 步骤导航 Composable
 */
import type { ComputedRef, Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  ROUTE_NAMES,
  ROUTE_TO_STEP,
  STEP_CONFIGS,
  STEP_TO_ROUTE,
  TOTAL_STEPS,
} from '../router/route-constants';

/**
 * 步骤导航返回类型
 */
interface UseStepNavigationReturn {
  /** 当前步骤 (1-based) */
  currentStep: ComputedRef<number>;
  /** 步骤总数 */
  totalSteps: number;
  /** 步骤配置列表 */
  stepConfigs: typeof STEP_CONFIGS;
  /** 是否可以返回上一步 */
  canGoPrevious: ComputedRef<boolean>;
  /** 是否是最后一步 */
  isLastStep: ComputedRef<boolean>;
  /** 过渡动画名称 */
  transitionName: Ref<string>;
  /** 导航到上一步 */
  goToPrevious: () => void;
  /** 导航到下一步 */
  goToNext: () => void;
  /** 导航到指定步骤 */
  goToStep: (step: number) => void;
  /** 导航到第一步 */
  goToFirst: () => void;
}

/**
 * 使用步骤导航
 * 提供步骤导航相关的响应式状态和方法
 */
export function useStepNavigation(): UseStepNavigationReturn {
  const router = useRouter();
  const route = useRoute();
  const transitionName = ref('slide-left');

  // 从路由元信息或路由名获取当前步骤
  const currentStep = computed(() => {
    const step = route.meta?.step as number;
    if (step) return step;

    const routeName = route.name as string;
    return ROUTE_TO_STEP[routeName] || 1;
  });

  // 是否可以返回上一步
  const canGoPrevious = computed(() => currentStep.value > 1);

  // 是否是最后一步
  const isLastStep = computed(() => currentStep.value === TOTAL_STEPS);

  // 导航到指定步骤
  const goToStep = (step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      const routeName = STEP_TO_ROUTE[step];
      if (routeName) {
        router.push({ name: routeName });
      }
    }
  };

  // 导航到上一步
  const goToPrevious = () => {
    const prevStep = currentStep.value - 1;
    if (prevStep >= 1) {
      goToStep(prevStep);
    }
  };

  // 导航到下一步
  const goToNext = () => {
    const nextStep = currentStep.value + 1;
    if (nextStep <= TOTAL_STEPS) {
      goToStep(nextStep);
    }
  };

  // 导航到第一步
  const goToFirst = () => {
    router.push({ name: ROUTE_NAMES.BASIC_INFO });
  };

  // 监听路由变化，设置过渡方向
  watch(
    () => route.name,
    (newRoute, oldRoute) => {
      const newStep = ROUTE_TO_STEP[newRoute as string] || 1;
      const oldStep = ROUTE_TO_STEP[oldRoute as string] || 1;
      // 根据步骤变化决定动画方向
      transitionName.value = newStep > oldStep ? 'slide-left' : 'slide-right';
    },
  );

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,
    stepConfigs: STEP_CONFIGS,
    canGoPrevious,
    isLastStep,
    transitionName,
    goToPrevious,
    goToNext,
    goToStep,
    goToFirst,
  };
}
