export interface WorldbookEntryRef {
  name: string;
  enabled: boolean;
  bookName: string;
}

/**
 * 获取 Home 当前应该读取的所有世界书来源。
 * 顺序：角色主世界书 → 角色附加世界书 → 当前聊天世界书 → 全局世界书。
 */
export function getActiveWorldBookNames(): string[] {
  const helper = window.top?.TavernHelper;
  if (!helper) return [];

  const charBooks = helper.getCharWorldbookNames('current');
  const chatBook = helper.getChatWorldbookName('current');
  const globalBooks = helper.getGlobalWorldbookNames();

  return [
    charBooks?.primary ?? null,
    ...(charBooks?.additional ?? []),
    chatBook,
    ...(globalBooks ?? []),
  ].filter((name, index, all): name is string => Boolean(name) && all.indexOf(name) === index);
}

/** @deprecated 仅保留给旧调用；Home 新逻辑应使用 getActiveWorldBookNames。 */
export function getWorldBookName(): string | null {
  return window.top?.TavernHelper.getCharWorldbookNames('current')?.primary ?? null;
}

// 获取一个或多个世界书的条目，并保留来源世界书名称
export async function getWorldbookEntries(
  bookNames: string | string[] | null,
): Promise<WorldbookEntryRef[]> {
  const helper = window.top?.TavernHelper;
  if (!helper || !bookNames) return [];

  const names = Array.isArray(bookNames) ? bookNames : [bookNames];
  const entries: WorldbookEntryRef[] = [];

  for (const bookName of names) {
    if (!bookName) continue;
    const worldbook = await helper.getWorldbook(bookName);
    if (!worldbook) continue;

    entries.push(
      ...worldbook.map((entry: { name: string; enabled: boolean }) => ({
        name: entry.name,
        enabled: entry.enabled,
        bookName,
      })),
    );
  }

  return entries;
}

// 使用正则筛选一个或多个世界书条目；默认读取 Home 当前全部来源
export async function getFilteredEntries(
  pattern: RegExp,
  bookNames: string | string[] | null = getActiveWorldBookNames(),
): Promise<WorldbookEntryRef[]> {
  const worldbook = await getWorldbookEntries(bookNames);
  if (worldbook.length === 0) return [];

  return worldbook.filter(entry => {
    pattern.lastIndex = 0;
    return pattern.test(entry.name);
  });
}

/**
 * 按条目自身的 bookName 写回原来源世界书。
 * 同名条目位于不同世界书时不会互相覆盖。
 */
export async function updateWorldBooks(
  entries: Array<{ name: string; enabled: boolean; bookName: string }>,
): Promise<void> {
  const helper = window.top?.TavernHelper;
  if (!helper || entries.length === 0) return;

  const entriesByBook = new Map<string, Array<{ name: string; enabled: boolean }>>();
  for (const entry of entries) {
    if (!entry.bookName) continue;
    if (!entriesByBook.has(entry.bookName)) {
      entriesByBook.set(entry.bookName, []);
    }
    entriesByBook.get(entry.bookName)!.push({
      name: entry.name,
      enabled: entry.enabled,
    });
  }

  await Promise.all(
    Array.from(entriesByBook, async ([bookName, bookEntries]) => {
      const enabledMap = new Map(bookEntries.map(entry => [entry.name, entry.enabled]));
      await helper.updateWorldbookWith(bookName, worldbook =>
        worldbook.map(entry => {
          const newEnabled = enabledMap.get(entry.name);
          return newEnabled === undefined ? entry : { ...entry, enabled: newEnabled };
        }),
      );
    }),
  );
}

/**
 * 兼容旧的单世界书写入接口。
 */
export async function updateWorldBook(
  entries: Array<{ name: string; enabled: boolean }>,
  bookName: string,
): Promise<void> {
  if (!bookName) return;
  await updateWorldBooks(entries.map(entry => ({ ...entry, bookName })));
}
