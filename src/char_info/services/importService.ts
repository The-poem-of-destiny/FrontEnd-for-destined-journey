import type { CharacterData } from '../types';
import { getSmartArray, parseAttributeValue } from './common';
import { normalizeCharacterDataKeys } from './yamlParser';

type VariableScope = { type: 'message'; message_id: 'latest' };

type TavernApiLike = {
  getVariables?: (scope: VariableScope) => Promise<Record<string, any>>;
  insertOrAssignVariables?: (payload: Record<string, any>, scope: VariableScope) => Promise<void>;
  getOrCreateChatWorldbook?: (chat: 'current', desiredName: string) => Promise<string>;
  createWorldbookEntries?: (bookName: string, entries: Array<Record<string, any>>) => Promise<void>;
  getChatWorldbookName?: (chat: 'current') => Promise<string | null>;
};

function getApi(): TavernApiLike {
  return ((window as any).TavernHelper || (window.parent as any)?.TavernHelper || window) as TavernApiLike;
}

function ensureString(val: unknown): string {
  if (Array.isArray(val)) return val.join(', ');
  return val ? String(val) : '';
}

function ensureArray(val: unknown): string[] {
  return getSmartArray(val);
}

function parseEffectMap(effectVal: unknown): Record<string, string> {
  if (effectVal && typeof effectVal === 'object' && !Array.isArray(effectVal)) {
    const effectObj = effectVal as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(effectObj)
        .map(([key, value]) => [String(key).trim(), ensureString(value).trim()] as const)
        .filter(([key, value]) => key.length > 0 && value.length > 0),
    );
  }

  const text = ensureString(effectVal).replace(/\r\n/g, '\n').trim();
  if (!text) return {};

  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const effectMap: Record<string, string> = {};
  const remains: string[] = [];

  lines.forEach(line => {
    const bracketMatch = line.match(/^\[([^\]]+)\]\s*[：:]\s*(.*)$/);
    if (bracketMatch) {
      const key = String(bracketMatch[1] || '').trim();
      const value = String(bracketMatch[2] || '').trim();
      if (key && value) effectMap[key] = value;
      return;
    }

    const plainMatch = line.match(/^([^[\]：:]+?)\s*[：:]\s*(.+)$/);
    if (plainMatch) {
      const key = String(plainMatch[1] || '').trim();
      const value = String(plainMatch[2] || '').trim();
      if (key && value) {
        effectMap[key] = value;
        return;
      }
    }

    remains.push(line);
  });

  if (Object.keys(effectMap).length > 0) {
    if (remains.length > 0) effectMap.描述 = remains.join('\n');
    return effectMap;
  }

  return { 描述: text };
}

function arrayToMap(arr: unknown, type: 'skill' | 'equip' | 'divinity'): Record<string, Record<string, any>> {
  const map: Record<string, Record<string, any>> = {};
  if (!Array.isArray(arr)) return map;

  arr.forEach(item => {
    if (!item || typeof item !== 'object') return;
    const anyItem = item as Record<string, any>;

    const itemName = ensureString(anyItem.名称 || anyItem.名稱).trim();
    if (!itemName) return;

    const { 名称, 名稱, ...rest } = anyItem;
    const processed: Record<string, any> = { ...rest };

    const tags = processed.标签 ?? processed.標籤;
    if (tags) processed.标签 = ensureArray(tags);
    else if (type === 'skill' || type === 'equip') processed.标签 = [];
    delete processed.標籤;

    if (type !== 'divinity') {
      processed.效果 = parseEffectMap(processed.效果);
    }

    if (type === 'equip') {
      processed.品质 = processed.品质 || processed.品質 || '未知';
      processed.类型 = processed.分类 || processed.分類 || processed.类型 || processed.類型 || '未知';
      processed.描述 = processed.描述 || '';
      processed.位置 = processed.位置 || '';
    } else if (type === 'skill') {
      processed.品质 = processed.品质 || processed.品質 || '未知';
      processed.类型 = processed.类型 || processed.類型 || '未知';
      processed.消耗 = processed.消耗 ? ensureString(processed.消耗) : '';
      processed.描述 = processed.描述 || '';
    }

    map[itemName] = processed;
  });

  return map;
}

export async function importToMvuVariables(data: CharacterData): Promise<void> {
  const api = getApi();
  if (typeof api.getVariables !== 'function' || typeof api.insertOrAssignVariables !== 'function') {
    throw new Error('未检测到 TavernHelper API (getVariables / insertOrAssignVariables)。');
  }

  const normalizedData = normalizeCharacterDataKeys(data);
  const charName = normalizedData.姓名 || 'Unknown';
  const targetScope: VariableScope = { type: 'message', message_id: 'latest' };

  const mvuData = {
    在场: true,
    生命层级: normalizedData.生命层级 || '第一层级/普通层级',
    等级: parseInt(String(normalizedData.等级 ?? '1'), 10) || 1,
    种族: normalizedData.种族 || '未知',
    身份: ensureArray(normalizedData.身份),
    职业: ensureArray(normalizedData.职业),
    性格: ensureString(normalizedData.性格).trim(),
    喜爱: ensureString(normalizedData.喜爱).trim(),
    外貌: ensureString(normalizedData.外貌特质).trim(),
    着装: ensureString(normalizedData.衣物装饰).trim(),
    属性: {
      力量: parseAttributeValue(normalizedData.属性?.力量),
      敏捷: parseAttributeValue(normalizedData.属性?.敏捷),
      体质: parseAttributeValue(normalizedData.属性?.体质),
      智力: parseAttributeValue(normalizedData.属性?.智力),
      精神: parseAttributeValue(normalizedData.属性?.精神),
    },
    技能: arrayToMap(normalizedData.技能, 'skill'),
    装备: arrayToMap(normalizedData.装备, 'equip'),
    登神长阶: {
      是否开启: !!(
        normalizedData.登神长阶 ||
        (normalizedData.生命层级 && String(normalizedData.生命层级).includes('神'))
      ),
      神位: normalizedData.登神长阶?.神位 || normalizedData.神位 || '',
      神国: {
        名称: normalizedData.登神长阶?.神国?.名称 || normalizedData.神国?.名称 || '',
        描述: normalizedData.登神长阶?.神国?.描述 || normalizedData.神国?.描述 || '',
      },
      要素: arrayToMap(normalizedData.登神长阶?.要素 || normalizedData.要素, 'divinity'),
      权能: arrayToMap(normalizedData.登神长阶?.权能 || normalizedData.权能, 'divinity'),
      法则: arrayToMap(normalizedData.登神长阶?.法则 || normalizedData.法则, 'divinity'),
    },
    命定契约: false,
    好感度: 0,
    心里话: '',
    背景故事: normalizedData.背景故事 || '',
  };

  let prefix = 'stat_data.';
  let currentVars: Record<string, any> | null = null;

  try {
    currentVars = await api.getVariables(targetScope);
    if (currentVars?.命定系统) prefix = '';
    else if (currentVars?.stat_data) prefix = 'stat_data.';
  } catch {
    prefix = 'stat_data.';
  }

  const keepIfPresent = (val: unknown) => (val === undefined || val === null ? undefined : val);

  const candidates: Array<Record<string, any> | undefined> = [];
  if (prefix === 'stat_data.') {
    candidates.push(currentVars?.stat_data?.命定系统?.关系列表?.[charName]);
    candidates.push(currentVars?.stat_data?.[charName]);
    candidates.push(currentVars?.stat_data?.ThatNPC);
  } else {
    candidates.push(currentVars?.命定系统?.关系列表?.[charName]);
  }

  let preservedFavor: unknown = undefined;
  let preservedHeart: unknown = undefined;
  for (const entry of candidates) {
    if (!entry) continue;
    if (preservedFavor === undefined) preservedFavor = keepIfPresent(entry?.好感度);
    if (preservedHeart === undefined) preservedHeart = keepIfPresent(entry?.心里话);
  }

  if (preservedFavor !== undefined) (mvuData as any).好感度 = preservedFavor;
  if (preservedHeart !== undefined) (mvuData as any).心里话 = preservedHeart;

  const updatePayload: Record<string, any> = {};
  if (prefix === 'stat_data.') {
    updatePayload.stat_data = { 命定系统: { 关系列表: { [charName]: mvuData } } };
  } else {
    updatePayload.命定系统 = { 关系列表: { [charName]: mvuData } };
  }

  await api.insertOrAssignVariables(updatePayload, targetScope);
}

export async function saveToChatWorldbook(data: CharacterData, originalYaml: string): Promise<void> {
  const api = getApi();
  if (typeof api.getOrCreateChatWorldbook !== 'function' || typeof api.createWorldbookEntries !== 'function') {
    throw new Error('未检测到 Worldbook API。');
  }

  const normalizedData = normalizeCharacterDataKeys(data);
  const characterName = normalizedData.姓名 || 'Unknown';
  const shortName = characterName.split(/[·\s]/)[0];
  const lorebookKey = shortName && shortName.trim().length > 0 ? shortName : characterName;

  let bookName: string | null = null;
  if (typeof api.getChatWorldbookName === 'function') {
    bookName = await api.getChatWorldbookName('current');
  }

  if (!bookName) {
    const now = new Date();
    const timeStr = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}_${now.getHours()}h_${now.getMinutes()}m_${now.getSeconds()}s`;
    const desiredName = `命定之诗-charinfo-Chat_Book_${timeStr}`;
    bookName = await api.getOrCreateChatWorldbook('current', desiredName);
  }

  const newEntry = {
    name: characterName,
    enabled: true,
    strategy: { type: 'selective', keys: [lorebookKey] },
    position: { type: 'after_character_definition', order: 152 },
    content: originalYaml,
  };

  await api.createWorldbookEntries(bookName, [newEntry]);
}
