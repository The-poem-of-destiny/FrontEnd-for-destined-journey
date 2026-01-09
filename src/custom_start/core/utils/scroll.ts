import { nextTick } from 'vue';

/**
 * 滚动到 iframe 位置（让父页面滚动到 iframe 可见区域）
 * 用于在弹窗显示时确保用户能看到弹窗内容
 */
export const scrollToIframe = (): void => {
  nextTick(() => {
    const frameElement = window.frameElement;
    if (frameElement) {
      frameElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
};
