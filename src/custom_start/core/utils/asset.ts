/** 优先使用开局填写的姓名，未填写时回退到酒馆当前玩家名称。 */
export function resolvePlayerPlaceholders<T>(value: T, playerName = ''): T {
  const resolvedName =
    playerName.trim() || (typeof SillyTavern !== 'undefined' ? SillyTavern.name1 : '');
  if (!resolvedName) return value;

  const resolve = (item: unknown): unknown => {
    // 使用回调，避免姓名中的 $&、$` 等字符被当作替换模式。
    if (typeof item === 'string') return item.replaceAll('<user>', () => resolvedName);
    if (Array.isArray(item)) return item.map(resolve);
    if (item && typeof item === 'object') {
      return Object.fromEntries(
        Object.entries(item).map(([key, nested]) => [key, resolve(nested)]),
      );
    }
    return item;
  };

  return resolve(value) as T;
}
