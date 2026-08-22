export function resolvePlayerPlaceholders<T>(value: T, playerName: string): T {
  if (!playerName) return value;
  if (typeof value === 'string') return value.replaceAll('<user>', playerName) as T;
  if (Array.isArray(value))
    return value.map(item => resolvePlayerPlaceholders(item, playerName)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        resolvePlayerPlaceholders(item, playerName),
      ]),
    ) as T;
  }
  return value;
}
