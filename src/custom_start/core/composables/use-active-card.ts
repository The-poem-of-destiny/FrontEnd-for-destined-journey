/**
 * 管理列表中“同一时间只有一张卡片展开详情”的状态。
 */
export function useActiveCard() {
  const activeName = ref('');

  const toggleActive = (name: string) => {
    activeName.value = activeName.value === name ? '' : name;
  };

  const isActive = (name: string) => activeName.value === name;

  const clearIfMissing = (names: string[]) => {
    if (activeName.value && !names.includes(activeName.value)) {
      activeName.value = '';
    }
  };

  return {
    activeName,
    toggleActive,
    isActive,
    clearIfMissing,
  };
}
