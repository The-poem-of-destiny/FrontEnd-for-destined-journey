import { reactive, ref } from 'vue';

/**
 * 横向拖动滚动逻辑
 * 用于移动端横向标签栏，避免每个筛选器重复 pointer 处理。
 */
export function useDragScroll() {
  const scrollRef = ref<HTMLElement | null>(null);
  const isDragging = ref(false);
  const suppressNextClick = ref(false);
  const dragState = reactive({
    pointerId: -1,
    startX: 0,
    scrollLeft: 0,
    hasMoved: false,
  });

  const shouldSuppressClick = () => {
    if (!suppressNextClick.value) return false;

    suppressNextClick.value = false;
    return true;
  };

  const handlePointerDown = (event: PointerEvent) => {
    const target = scrollRef.value;
    if (!target || target.scrollWidth <= target.clientWidth) return;

    isDragging.value = true;
    suppressNextClick.value = false;
    dragState.pointerId = event.pointerId;
    dragState.startX = event.clientX;
    dragState.scrollLeft = target.scrollLeft;
    dragState.hasMoved = false;
    target.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!isDragging.value || dragState.pointerId !== event.pointerId) return;

    const target = scrollRef.value;
    if (!target) return;

    const deltaX = event.clientX - dragState.startX;
    if (Math.abs(deltaX) > 4) {
      dragState.hasMoved = true;
      event.preventDefault();
    }
    target.scrollLeft = dragState.scrollLeft - deltaX;
  };

  const stopDragging = (event: PointerEvent) => {
    if (dragState.pointerId !== event.pointerId) return;

    if (scrollRef.value?.hasPointerCapture(event.pointerId)) {
      scrollRef.value.releasePointerCapture(event.pointerId);
    }

    isDragging.value = false;
    dragState.pointerId = -1;
    if (dragState.hasMoved) {
      suppressNextClick.value = true;
      window.setTimeout(() => {
        suppressNextClick.value = false;
      }, 0);
    }
  };

  return {
    scrollRef,
    isDragging,
    shouldSuppressClick,
    dragScrollHandlers: {
      pointerdown: handlePointerDown,
      pointermove: handlePointerMove,
      pointerup: stopDragging,
      pointercancel: stopDragging,
    },
  };
}
