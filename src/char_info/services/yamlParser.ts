import { load } from 'js-yaml';
import type { CharacterData, FriendlyYamlError, ParseResult } from '../types';

const KEY_ALIAS_TO_SIMPLIFIED: Record<string, string> = {
  名字: '姓名',
  名稱: '名称',
  等級: '等级',
  種族: '种族',
  生命層級: '生命层级',
  身分: '身份',
  職業: '职业',
  喜愛: '喜爱',
  外貌特質: '外貌特质',
  外貌特徵: '外貌特质',
  外貌特征: '外貌特质',
  衣物裝飾: '衣物装饰',
  屬性: '属性',
  資源: '资源',
  體質: '体质',
  裝備: '装备',
  登神長階: '登神长阶',
  神國: '神国',
  權能: '权能',
  法則: '法则',
  標籤: '标签',
  品質: '品质',
  類型: '类型',
  分類: '分类',
  被動效果: '被动效果',
  主動效果: '主动效果',
};

function visualizeForDisplay(str: unknown): string {
  return String(str ?? '')
    .replace(/\t/g, '⇥')
    .replace(/\u00A0/g, '⍽');
}

function normalizeKey(key: string): string {
  return KEY_ALIAS_TO_SIMPLIFIED[key] || key;
}

function normalizeObjectKeysDeep(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map(item => normalizeObjectKeysDeep(item));
  }

  if (!input || typeof input !== 'object') {
    return input;
  }

  const source = input as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  Object.entries(source).forEach(([rawKey, rawValue]) => {
    const normalizedKey = normalizeKey(String(rawKey));
    const normalizedValue = normalizeObjectKeysDeep(rawValue);

    if (!(normalizedKey in output) || rawKey === normalizedKey) {
      output[normalizedKey] = normalizedValue;
    }
  });

  return output;
}

export function normalizeCharacterDataKeys(data: CharacterData): CharacterData {
  return normalizeObjectKeysDeep(data) as CharacterData;
}

export function cleanYaml(yamlStr: string): string {
  if (!yamlStr) return '';

  const normalized = yamlStr
    .replace(/\u00A0/g, ' ')
    .replace(/\t/g, '  ')
    .replace(/】/g, ']')
    .replace(/【/g, '[');

  const lines = normalized.split('\n');
  const sensitiveKeys = [
    '身份',
    '身分',
    '职业',
    '職業',
    '性格',
    '喜爱',
    '喜愛',
    '外貌特质',
    '外貌特質',
    '外貌特征',
    '外貌特徵',
    '衣物装饰',
    '衣物裝飾',
    '背景故事',
    '描述',
    '效果',
    '标签',
    '標籤',
    '消耗',
    '类型',
    '類型',
    '品质',
    '品質',
    '神位',
    '名称',
    '名稱',
    '姓名',
    '名字',
    '种族',
    '種族',
    '等级',
    '等級',
    '生命层级',
    '生命層級',
  ];
  const attrKeys = ['力量', '敏捷', '体质', '體質', '智力', '精神'];

  const cleanedLines = lines.map(line => {
    line = line.replace(/^(\s*)(-\s*)?([-\w\u4e00-\u9fa5]+)\s*：/, (_m, indent, dash, key) => {
      return `${indent}${dash || ''}${key}:`;
    });

    const match = line.match(/^(\s*)(-\s*)?([-\w\u4e00-\u9fa5]+)\s*:\s*(.*)$/);
    if (!match) return line;

    const indent = match[1];
    const dash = match[2] || '';
    const key = match[3];
    let val = match[4].trim();

    if (!val) return line;
    if (val.startsWith('|') || val.startsWith('>')) return line;

    if (attrKeys.some(k => key.includes(k))) {
      if ((/[+=]/.test(val) || val.includes('{')) && !/^["'].*["']$/.test(val)) {
        val = val.replace(/"/g, '\\"');
        return `${indent}${dash}${key}: "${val}"`;
      }
    }

    const isSensitive = sensitiveKeys.some(k => key.includes(k));
    const hasDangerousChars = /[{}[\]]/.test(val);
    const hasQuoteInside = val.includes('"');
    const isFullyQuoted = /^["'].*["']$/.test(val);

    if ((isSensitive || hasDangerousChars || hasQuoteInside) && !isFullyQuoted) {
      val = val.replace(/"/g, '\\"');
      return `${indent}${dash}${key}: "${val}"`;
    }

    return line;
  });

  return cleanedLines.join('\n');
}

function buildFriendlyYamlError(err: unknown, originalYaml: string, cleanedYaml: string): FriendlyYamlError {
  const e = err as { reason?: string; message?: string; mark?: { line?: number; column?: number } };
  const mark = e?.mark;
  const message = String(e?.reason || e?.message || String(err));

  if (!mark || typeof mark.line !== 'number') {
    return { message };
  }

  const line = mark.line;
  const column = typeof mark.column === 'number' ? mark.column : 0;

  const originalLines = String(originalYaml ?? '').split('\n');
  const cleanedLines = String(cleanedYaml ?? '').split('\n');

  const originalLine = originalLines[line] ?? '';
  const cleanedLine = cleanedLines[line] ?? '';

  const cleanedVisual = visualizeForDisplay(cleanedLine);
  const originalVisual = visualizeForDisplay(originalLine);

  const caretPad = ' '.repeat(Math.max(0, Math.min(column, cleanedVisual.length)));
  const caretLine = `${caretPad}^`;

  return {
    message,
    line,
    column,
    cleanedLine: cleanedVisual,
    originalLine: originalVisual,
    caretLine,
  };
}

export function parseCharacterYaml(yamlText: string): ParseResult {
  const cleaned = cleanYaml(yamlText);
  try {
    const parsedData = load(cleaned) as CharacterData | null;
    if (!parsedData) throw new Error('解析结果为空');

    const normalizedData = normalizeCharacterDataKeys(parsedData);
    return { success: true, data: normalizedData };
  } catch (err) {
    return {
      success: false,
      error: buildFriendlyYamlError(err, yamlText, cleaned),
    };
  }
}
