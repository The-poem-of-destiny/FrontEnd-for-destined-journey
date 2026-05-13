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

type ScrollBridgeOptions = {
  isFullscreen?: () => boolean;
};

const WHEEL_LINE_HEIGHT = 16;

const normalizeWheelDelta = (event: WheelEvent) => {
  const multiplier =
    event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? WHEEL_LINE_HEIGHT
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? window.innerHeight
        : 1;

  return {
    x: event.deltaX * multiplier,
    y: event.deltaY * multiplier,
  };
};

const canScrollElement = (element: Element, deltaX: number, deltaY: number): boolean => {
  const style = window.getComputedStyle(element);
  const canScrollY =
    /(auto|scroll|overlay)/.test(style.overflowY) &&
    element.scrollHeight > element.clientHeight &&
    ((deltaY < 0 && element.scrollTop > 0) ||
      (deltaY > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1));

  const canScrollX =
    /(auto|scroll|overlay)/.test(style.overflowX) &&
    element.scrollWidth > element.clientWidth &&
    ((deltaX < 0 && element.scrollLeft > 0) ||
      (deltaX > 0 && element.scrollLeft + element.clientWidth < element.scrollWidth - 1));

  return canScrollY || canScrollX;
};

const hasScrollableTarget = (target: EventTarget | null, deltaX: number, deltaY: number) => {
  if (!(target instanceof Element)) {
    return false;
  }

  for (let element: Element | null = target; element; element = element.parentElement) {
    if (element === document.body || element === document.documentElement) {
      break;
    }

    if (canScrollElement(element, deltaX, deltaY)) {
      return true;
    }
  }

  return false;
};

const canScrollCurrentDocument = (deltaX: number, deltaY: number) => {
  const scroller = document.scrollingElement || document.documentElement;
  const canScrollY =
    scroller.scrollHeight > scroller.clientHeight &&
    ((deltaY < 0 && scroller.scrollTop > 0) ||
      (deltaY > 0 && scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1));
  const canScrollX =
    scroller.scrollWidth > scroller.clientWidth &&
    ((deltaX < 0 && scroller.scrollLeft > 0) ||
      (deltaX > 0 && scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1));

  return canScrollY || canScrollX;
};

const scrollCurrentDocumentBy = (deltaX: number, deltaY: number) => {
  const scroller = document.scrollingElement || document.documentElement;
  const beforeTop = scroller.scrollTop;
  const beforeLeft = scroller.scrollLeft;

  scroller.scrollBy({ left: deltaX, top: deltaY, behavior: 'auto' });

  if (scroller.scrollTop !== beforeTop || scroller.scrollLeft !== beforeLeft) {
    return true;
  }

  window.scrollBy({ left: deltaX, top: deltaY, behavior: 'auto' });
  return window.scrollY !== beforeTop || window.scrollX !== beforeLeft;
};

const getParentScrollContainer = (
  parentDocument: Document,
  frameElement: Element,
  deltaX: number,
  deltaY: number,
) => {
  for (let element = frameElement.parentElement; element; element = element.parentElement) {
    if (canScrollParentElement(parentDocument, element, deltaX, deltaY)) {
      return element;
    }
  }

  return parentDocument.scrollingElement || parentDocument.documentElement;
};

const canScrollParentElement = (
  parentDocument: Document,
  element: Element,
  deltaX: number,
  deltaY: number,
) => {
  const style = parentDocument.defaultView?.getComputedStyle(element);

  if (!style) {
    return false;
  }

  const canScrollY =
    /(auto|scroll|overlay)/.test(style.overflowY) &&
    element.scrollHeight > element.clientHeight &&
    ((deltaY < 0 && element.scrollTop > 0) ||
      (deltaY > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1));

  const canScrollX =
    /(auto|scroll|overlay)/.test(style.overflowX) &&
    element.scrollWidth > element.clientWidth &&
    ((deltaX < 0 && element.scrollLeft > 0) ||
      (deltaX > 0 && element.scrollLeft + element.clientWidth < element.scrollWidth - 1));

  return canScrollY || canScrollX;
};

const scrollParentBy = (deltaX: number, deltaY: number) => {
  try {
    const frame = window.frameElement;
    const parentWindow = window.parent;
    const parentDocument = parentWindow?.document;

    if (!frame || !parentDocument || parentWindow === window) {
      return false;
    }

    const scroller = getParentScrollContainer(parentDocument, frame, deltaX, deltaY);
    const beforeTop = scroller.scrollTop;
    const beforeLeft = scroller.scrollLeft;

    scroller.scrollBy({ left: deltaX, top: deltaY, behavior: 'auto' });

    if (scroller.scrollTop !== beforeTop || scroller.scrollLeft !== beforeLeft) {
      return true;
    }

    parentWindow.scrollBy({ left: deltaX, top: deltaY, behavior: 'auto' });
    return true;
  } catch {
    return false;
  }
};

/**
 * iframe 内的 wheel 事件不会自然冒泡到 SillyTavern 外层页面。
 * 没有内部滚动容器可用时，手动把滚动量交给父页面；全屏时则保留 iframe 自身滚动。
 */
export const setupIframeWheelScrollBridge = (options: ScrollBridgeOptions = {}): (() => void) => {
  const handleWheel = (event: WheelEvent) => {
    if (event.defaultPrevented || event.ctrlKey) {
      return;
    }

    const { x, y } = normalizeWheelDelta(event);

    if (!x && !y) {
      return;
    }

    if (hasScrollableTarget(event.target, x, y)) {
      return;
    }

    if (options.isFullscreen?.()) {
      if (canScrollCurrentDocument(x, y) && scrollCurrentDocumentBy(x, y)) {
        event.preventDefault();
      }
      return;
    }

    if (scrollParentBy(x, y) || scrollCurrentDocumentBy(x, y)) {
      event.preventDefault();
    }
  };

  document.addEventListener('wheel', handleWheel, { capture: true, passive: false });

  return () => {
    document.removeEventListener('wheel', handleWheel, { capture: true });
  };
};
