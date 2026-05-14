import { klona } from 'klona';
import type { Equipment, Item, Skill } from '../types';

export type LibraryItemType = 'equipment' | 'item' | 'skill';
export type LibraryContent = Equipment | Item | Skill;

export interface LibraryEntry<T extends LibraryContent = LibraryContent> {
  id: string;
  type: LibraryItemType;
  name: string;
  updatedAt: number;
  data: T;
}

export interface LibraryContentPack {
  schema: 'destiny_custom_start.content_pack';
  version: 1;
  exportedAt: number;
  equipments: Equipment[];
  items: Item[];
  skills: Skill[];
}

interface LibraryStorage {
  entries: LibraryEntry[];
}

const LIBRARY_STORAGE_KEY = 'destiny_custom_content_library_v1';
const LIBRARY_WORLDBOOK_NAME_KEY = 'destiny_custom_content_worldbook_name';
const LIBRARY_WORLDBOOK_ENTRY_NAME = '命定之诗::自定义内容库';
const LIBRARY_UPDATE_EVENT = 'destiny-custom-library-updated';
const DEFAULT_LIBRARY_WORLDBOOK_NAME = 'custom_start_database';
const DIY_LIBRARY_GROUP_NAME = '玩家DIY内容';

const TYPE_LABELS: Record<LibraryItemType, string> = {
  equipment: '装备',
  item: '道具',
  skill: '技能',
};

const getEmptyStorage = (): LibraryStorage => ({ entries: [] });

const createLibraryId = (type: LibraryItemType, name: string): string => `${type}:${name.trim()}`;

const isBrowser = () => typeof window !== 'undefined';

function emitLibraryUpdated(): void {
  if (!isBrowser()) return;

  window.dispatchEvent(new CustomEvent(LIBRARY_UPDATE_EVENT));
}

export function getLibraryUpdateEventName(): string {
  return LIBRARY_UPDATE_EVENT;
}

function readFromCharacterVariables(): LibraryStorage | null {
  if (typeof getVariables !== 'function') return null;

  try {
    const variables = getVariables({ type: 'character' });
    const storage = _.get(variables, LIBRARY_STORAGE_KEY) as LibraryStorage | undefined;

    if (storage && _.isArray(storage.entries)) {
      return storage;
    }
  } catch (error) {
    console.warn('读取自定义素材库角色变量失败，使用本地回退:', error);
  }

  return null;
}

function writeToCharacterVariables(storage: LibraryStorage): boolean {
  if (typeof insertOrAssignVariables !== 'function') return false;

  try {
    insertOrAssignVariables({ [LIBRARY_STORAGE_KEY]: storage }, { type: 'character' });
    return true;
  } catch (error) {
    console.warn('保存自定义素材库到角色变量失败，使用本地回退:', error);
    return false;
  }
}

function readConfiguredWorldbookNameFromGlobal(): string {
  if (typeof getVariables !== 'function') return '';

  try {
    const variables = getVariables({ type: 'global' });
    return String(_.get(variables, LIBRARY_WORLDBOOK_NAME_KEY, '') || '').trim();
  } catch (error) {
    console.warn('读取素材库世界书名称失败，使用本地回退:', error);
    return '';
  }
}

function writeConfiguredWorldbookNameToGlobal(name: string): boolean {
  if (typeof insertOrAssignVariables !== 'function') return false;

  try {
    insertOrAssignVariables({ [LIBRARY_WORLDBOOK_NAME_KEY]: name }, { type: 'global' });
    return true;
  } catch (error) {
    console.warn('保存素材库世界书名称失败，使用本地回退:', error);
    return false;
  }
}

function readFromLocalStorage(): LibraryStorage | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (!raw) return null;

    const storage = JSON.parse(raw) as LibraryStorage;
    return storage && _.isArray(storage.entries) ? storage : null;
  } catch (error) {
    console.warn('读取本地自定义素材库失败:', error);
    return null;
  }
}

function writeToLocalStorage(storage: LibraryStorage): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.warn('保存本地自定义素材库失败:', error);
  }
}

function readConfiguredWorldbookNameFromLocalStorage(): string {
  if (!isBrowser()) return '';

  try {
    return window.localStorage.getItem(LIBRARY_WORLDBOOK_NAME_KEY)?.trim() || '';
  } catch {
    return '';
  }
}

function writeConfiguredWorldbookNameToLocalStorage(name: string): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(LIBRARY_WORLDBOOK_NAME_KEY, name);
  } catch (error) {
    console.warn('保存本地素材库世界书名称失败:', error);
  }
}

export function getConfiguredLibraryWorldbookName(): string {
  return (
    readConfiguredWorldbookNameFromGlobal() ||
    readConfiguredWorldbookNameFromLocalStorage() ||
    DEFAULT_LIBRARY_WORLDBOOK_NAME
  );
}

export function setConfiguredLibraryWorldbookName(name: string): void {
  const trimmedName = name.trim();
  writeConfiguredWorldbookNameToGlobal(trimmedName);
  writeConfiguredWorldbookNameToLocalStorage(trimmedName);
}

export function getLibraryStorage(): LibraryStorage {
  return readFromLocalStorage() || readFromCharacterVariables() || getEmptyStorage();
}

export function saveLibraryStorage(storage: LibraryStorage): void {
  writeToLocalStorage(storage);
  emitLibraryUpdated();

  void saveLibraryStorageToWorldbook(storage);
}

export function createLibraryEntries(
  items: Array<{ type: LibraryItemType; item: LibraryContent }>,
): LibraryEntry[] {
  const now = Date.now();

  return _.map(items, ({ type, item }) => ({
    id: createLibraryId(type, item.name),
    type,
    name: item.name,
    updatedAt: now,
    data: {
      ...klona(item),
      isCustom: true,
    },
  }));
}

export function upsertLibraryEntries(
  entries: LibraryEntry[],
  options: { deleteIds?: string[] } = {},
): number {
  if (_.isEmpty(entries) && _.isEmpty(options.deleteIds)) return 0;

  const storage = getLibraryStorage();
  const deleteIdSet = new Set(options.deleteIds || []);

  if (deleteIdSet.size > 0) {
    storage.entries = storage.entries.filter(entry => !deleteIdSet.has(entry.id));
  }

  _.forEach(entries, entry => {
    const existingIndex = _.findIndex(storage.entries, { id: entry.id });

    if (existingIndex >= 0) {
      storage.entries[existingIndex] = entry;
      return;
    }

    storage.entries.push(entry);
  });

  saveLibraryStorage(storage);
  return entries.length;
}

export function deleteLibraryEntries(ids: string[]): number {
  if (_.isEmpty(ids)) return 0;

  const storage = getLibraryStorage();
  const deleteIdSet = new Set(ids);
  const beforeCount = storage.entries.length;
  storage.entries = storage.entries.filter(entry => !deleteIdSet.has(entry.id));
  const deletedCount = beforeCount - storage.entries.length;

  if (deletedCount > 0) {
    saveLibraryStorage(storage);
  }

  return deletedCount;
}

export function listLibraryEntries(type?: LibraryItemType): LibraryEntry[] {
  const entries = getLibraryStorage().entries;
  const filteredEntries = type ? _.filter(entries, { type }) : entries;
  return _.orderBy(filteredEntries, ['updatedAt', 'name'], ['desc', 'asc']);
}

export function getLibraryDataByType<T extends LibraryContent>(
  type: LibraryItemType,
): Record<string, T[]> {
  const entries = listLibraryEntries(type);

  return _.reduce(
    entries,
    (result, entry) => {
      result[DIY_LIBRARY_GROUP_NAME] = result[DIY_LIBRARY_GROUP_NAME] || [];
      result[DIY_LIBRARY_GROUP_NAME].push(klona(entry.data) as T);
      return result;
    },
    {} as Record<string, T[]>,
  );
}

function normalizeWorldbookStorage(value: unknown): LibraryStorage | null {
  if (!_.isPlainObject(value)) return null;

  const storage = value as LibraryStorage;
  return _.isArray(storage.entries) ? storage : null;
}

function parseWorldbookStorageContent(content: string): LibraryStorage | null {
  try {
    const parsed = JSON.parse(content);
    return normalizeWorldbookStorage(parsed);
  } catch (error) {
    console.warn('素材库世界书条目不是有效 JSON:', error);
    return null;
  }
}

function isLibraryWorldbookEntry(entry: Record<string, unknown>): boolean {
  return (
    entry.name === LIBRARY_WORLDBOOK_ENTRY_NAME ||
    entry.comment === LIBRARY_WORLDBOOK_ENTRY_NAME ||
    _.get(entry, 'extra.destinyCustomContentLibrary') === true
  );
}

function createLibraryWorldbookEntry(storage: LibraryStorage): Record<string, unknown> {
  return {
    name: LIBRARY_WORLDBOOK_ENTRY_NAME,
    enabled: false,
    strategy: {
      type: 'constant',
      keys: [],
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: {
      type: 'before_character_definition',
      role: 'system',
      depth: 0,
      order: 0,
    },
    content: JSON.stringify(storage, null, 2),
    probability: 100,
    recursion: {
      prevent_incoming: true,
      prevent_outgoing: true,
      delay_until: null,
    },
    effect: {
      sticky: null,
      cooldown: null,
      delay: null,
    },
    extra: {
      destinyCustomContentLibrary: true,
    },
  };
}

async function createLibraryWorldbook(
  bookName: string,
  entries: PartialDeep<WorldbookEntry>[],
): Promise<boolean> {
  if (typeof createOrReplaceWorldbook === 'function') {
    return createOrReplaceWorldbook(bookName, entries, { render: 'debounced' });
  }

  if (typeof createWorldbook === 'function') {
    return createWorldbook(bookName, entries as WorldbookEntry[]);
  }

  return false;
}

async function readLibraryStorageFromWorldbook(bookName: string): Promise<LibraryStorage | null> {
  if (typeof getWorldbook !== 'function') return null;

  try {
    const worldbook = await getWorldbook(bookName);
    const storageEntry = _.find(worldbook, entry =>
      isLibraryWorldbookEntry(entry as unknown as Record<string, unknown>),
    );

    if (!storageEntry?.content) return null;

    return parseWorldbookStorageContent(storageEntry.content);
  } catch (error) {
    console.warn(`读取素材库世界书「${bookName}」失败:`, error);
    return null;
  }
}

export async function syncLibraryStorageFromWorldbook(
  options: { silent?: boolean } = {},
): Promise<LibraryStorage | null> {
  const bookName = getConfiguredLibraryWorldbookName();
  if (!bookName) return null;

  const storage = await readLibraryStorageFromWorldbook(bookName);
  if (!storage) return null;

  writeToLocalStorage(storage);
  emitLibraryUpdated();

  if (!options.silent) {
    toastr.success(`已从世界书「${bookName}」读取自定义内容`);
  }
  return storage;
}

export async function saveLibraryStorageToWorldbook(
  storage = getLibraryStorage(),
): Promise<boolean> {
  const bookName = getConfiguredLibraryWorldbookName();
  if (!bookName) return false;

  if (
    typeof getWorldbookNames !== 'function' ||
    (typeof createOrReplaceWorldbook !== 'function' && typeof createWorldbook !== 'function') ||
    typeof updateWorldbookWith !== 'function'
  ) {
    return false;
  }

  const storageEntry = createLibraryWorldbookEntry(storage) as PartialDeep<WorldbookEntry>;

  try {
    const bookNames = getWorldbookNames();
    if (!bookNames.includes(bookName)) {
      return createLibraryWorldbook(bookName, [storageEntry]);
    }

    await updateWorldbookWith(
      bookName,
      worldbook => [
        ...worldbook.filter(
          entry => !isLibraryWorldbookEntry(entry as unknown as Record<string, unknown>),
        ),
        storageEntry,
      ],
      { render: 'debounced' },
    );
    return true;
  } catch (error) {
    console.warn(`保存素材库到世界书「${bookName}」失败:`, error);
    return false;
  }
}

export async function ensureLibraryWorldbook(): Promise<boolean> {
  return saveLibraryStorageToWorldbook(getLibraryStorage());
}

export async function configureLibraryWorldbook(bookName: string): Promise<boolean> {
  const trimmedName = bookName.trim();

  if (!trimmedName) {
    toastr.warning('请输入用于存储自定义内容的世界书名称');
    return false;
  }

  setConfiguredLibraryWorldbookName(trimmedName);
  const syncedStorage = await readLibraryStorageFromWorldbook(trimmedName);

  if (syncedStorage) {
    writeToLocalStorage(syncedStorage);
    emitLibraryUpdated();
    toastr.success(`已连接世界书「${trimmedName}」`);
    return true;
  }

  const saved = await saveLibraryStorageToWorldbook(getLibraryStorage());
  if (saved) {
    toastr.success(`已创建或更新世界书「${trimmedName}」`);
    return true;
  }

  toastr.warning('当前环境不能写入世界书，已暂存世界书名称并继续使用本地缓存');
  return false;
}

function downloadTextFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function createContentPack(entries: LibraryEntry[]): LibraryContentPack {
  return {
    schema: 'destiny_custom_start.content_pack',
    version: 1,
    exportedAt: Date.now(),
    equipments: _.map(
      _.filter(entries, { type: 'equipment' }),
      entry => klona(entry.data) as Equipment,
    ),
    items: _.map(_.filter(entries, { type: 'item' }), entry => klona(entry.data) as Item),
    skills: _.map(_.filter(entries, { type: 'skill' }), entry => klona(entry.data) as Skill),
  };
}

export function downloadContentPack(entries: LibraryEntry[]): void {
  const pack = createContentPack(entries);
  const date = new Date().toISOString().slice(0, 10);
  downloadTextFile(JSON.stringify(pack, null, 2), `destiny_content_pack_${date}.json`);
  toastr.success(`已导出 ${entries.length} 个素材 JSON`);
}

function readJsonFileFromInput(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('未选择文件'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(JSON.parse(reader.result as string));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });

    input.addEventListener('cancel', () => {
      reject(new Error('用户取消'));
    });

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
}

function isContentPackLike(value: unknown): value is Partial<LibraryContentPack> {
  if (!_.isPlainObject(value)) return false;

  const pack = value as Partial<LibraryContentPack>;
  return _.some([pack.equipments, pack.items, pack.skills], _.isArray);
}

export async function importContentPackFromFile(): Promise<number> {
  const data = await readJsonFileFromInput();

  if (!isContentPackLike(data)) {
    toastr.error('导入失败：文件不是素材包 JSON');
    return 0;
  }

  const entries = createLibraryEntries([
    ..._.map(data.equipments || [], item => ({ type: 'equipment' as const, item })),
    ..._.map(data.items || [], item => ({ type: 'item' as const, item })),
    ..._.map(data.skills || [], item => ({ type: 'skill' as const, item })),
  ]);

  const importedCount = upsertLibraryEntries(entries);

  if (importedCount > 0) {
    toastr.success(`已导入 ${importedCount} 个素材到素材库`);
  } else {
    toastr.warning('素材包中没有可导入的项目');
  }

  return importedCount;
}

function formatEffect(effect: Record<string, string> | undefined): string {
  if (!effect || _.isEmpty(effect)) return '无';

  return _.map(effect, (value, key) => `- ${key}：${value}`).join('\n');
}

function formatWorldbookContent(entry: LibraryEntry): string {
  const item = entry.data;
  const label = TYPE_LABELS[entry.type];
  const tags = item.tag?.length ? item.tag.join('、') : '无';

  return [
    `【${label}：${item.name}】`,
    `类型：${item.type || '未分类'}`,
    `品质：${item.rarity}`,
    `消耗点数：${item.cost}`,
    `标签：${tags}`,
    `效果：`,
    formatEffect(item.effect),
    `描述：${item.description || '无'}`,
  ].join('\n');
}

export function downloadWorldbookEntries(entries: LibraryEntry[]): void {
  const worldbook = {
    name: '命定之诗自定义素材库',
    entries: _.fromPairs(
      _.map(entries, (entry, index) => [
        String(index),
        {
          uid: index,
          key: [entry.name],
          keysecondary: [],
          comment: `${TYPE_LABELS[entry.type]} - ${entry.name}`,
          content: formatWorldbookContent(entry),
          constant: false,
          selective: false,
          enabled: true,
          position: 0,
        },
      ]),
    ),
  };
  const date = new Date().toISOString().slice(0, 10);

  downloadTextFile(JSON.stringify(worldbook, null, 2), `destiny_worldbook_entries_${date}.json`);
  toastr.success(`已导出 ${entries.length} 个世界书条目`);
}
