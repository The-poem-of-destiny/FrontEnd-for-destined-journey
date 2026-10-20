/** 自定义开局使用 custom 占位键，展示时按阶段提供可读名称。 */
export const getAscensionItemLabel = (name: string, section: '要素' | '权能' | '法则'): string =>
  name === 'custom' ? `自定义${section}` : name;
