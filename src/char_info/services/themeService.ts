import type { CharacterData, ThemeResolved } from '../types';

export const raceColorMap: Record<string, string> = {
  神祗: '#FFFFFF',
  龙族: '#FFD700',
  龙姬: '#FFD700',
  龙裔: '#FFA500',
  巨龙: '#FFD700',
  古龙: '#FFD700',
  亚龙: '#FFAE42',
  血姬: '#FF0000',
  血族: '#DC143C',
  亡灵种族: '#32CD32',
  不死生物: '#32CD32',
  翼民: '#00BFFF',
  翼族: '#00BFFF',
  堕羽民: '#9370DB',
  女妖: '#FF1493',
  人类: '#FFDAB9',
  矮人: '#D2691E',
  半身人: '#FFD700',
  精灵: '#00FF7F',
  光翅妖精: '#FFFF00',
  汐海妖精: '#00FFFF',
  妖精: '#FF00FF',
  宁芙: '#FF00FF',
  兽族: '#FF4500',
  黑角民: '#00CED1',
  蛇女: '#00FF7F',
  半人马: '#FF8C00',
  人鱼: '#00FFFF',
  地精: '#32CD32',
  魔物: '#8A2BE2',
  深渊魔族: '#9400D3',
  异域生物: '#FF00FF',
  巨人: '#D2691E',
  半巨人: '#D2691E',
  小巨人: '#D2691E',
  霜巨人: '#00BFFF',
  泰坦人族: '#FFD700',
  山妖: '#DAA520',
  食人魔: '#7CFC00',
  巨魔: '#7CFC00',
  雪怪: '#E0FFFF',
  诗灵: '#EE82EE',
  英灵: '#00BFFF',
  从者: '#00BFFF',
  构装体: '#00CED1',
  人造生物: '#00FF7F',
  元素生物: '#FF0000',
  植物生物: '#00FF00',
  不定形生物: '#7CFC00',
  其他: '#E0E0E0',
};

export const tierColorMap: Record<number, string> = {
  1: '#57595D',
  2: '#50C878',
  3: '#2196F3',
  4: '#9932CC',
  5: '#FFD700',
  6: '#DC143C',
  7: '#00FFFF',
};

const RACE_ALIAS_TO_SIMPLIFIED: Record<string, string> = {
  人類: '人类',
  其它: '其他',
  詩靈: '诗灵',
  器靈: '器灵',
  鑄魂: '铸魂',
  願靈: '愿灵',
  聖靈: '圣灵',
  英靈: '英灵',
  從者: '从者',
  構裝: '构装',
  史萊姆: '史莱姆',
  異域: '异域',
  異界: '异界',
  精靈: '精灵',
  木靈: '木灵',
  天舞龍: '天舞龙',
  魔紋龍: '魔纹龙',
  亞龍: '亚龙',
  北境龍裔: '北境龙裔',
  東方後裔: '东方后裔',
  花靈: '花灵',
  人馬: '人马',
  蠑螈: '蝾螈',
  墮翼: '堕翼',
  墮羽: '堕羽',
  深淵: '深渊',
  小惡魔: '小恶魔',
  惡魔: '恶魔',
  龍: '龙',
  亞: '亚',
  靈: '灵',
  詩: '诗',
  異: '异',
  體: '体',
  構: '构',
  裝: '装',
  祇: '祗',
  魚: '鱼',
  獸: '兽',
  種: '种',
  寧: '宁',
  墮: '堕',
  聖: '圣',
  惡: '恶',
  從: '从',
  願: '愿',
  鑄: '铸',
  機: '机',
  鳥: '鸟',
  馬: '马',
};

function hexToRgbObj(hex: string): { r: number; g: number; b: number } {
  let h = (hex || '#808080').replace(/^#/, '');
  if (h.length === 3) h = `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return {
    r: Number.isFinite(r) ? r : 128,
    g: Number.isFinite(g) ? g : 128,
    b: Number.isFinite(b) ? b : 128,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgb(hex: string): string {
  const { r, g, b } = hexToRgbObj(hex);
  return `${r}, ${g}, ${b}`;
}

export function harmonizeAccent(
  hex: string,
  mixTarget = '#94a3b8',
  mixRatio = 0.48,
  minLuma = 92,
  maxLuma = 188,
): string {
  const base = hexToRgbObj(hex);
  const target = hexToRgbObj(mixTarget);

  let r = base.r * (1 - mixRatio) + target.r * mixRatio;
  let g = base.g * (1 - mixRatio) + target.g * mixRatio;
  let b = base.b * (1 - mixRatio) + target.b * mixRatio;

  const luma = () => 0.299 * r + 0.587 * g + 0.114 * b;
  let current = luma();

  if (current < minLuma) {
    const t = (minLuma - current) / 255;
    r = r + (255 - r) * t;
    g = g + (255 - g) * t;
    b = b + (255 - b) * t;
    current = luma();
  }

  if (current > maxLuma) {
    const t = (current - maxLuma) / 255;
    r = r * (1 - t);
    g = g * (1 - t);
    b = b * (1 - t);
  }

  return rgbToHex(r, g, b);
}

function resolveTier(raw: unknown): number {
  const tierMap: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7 };
  const tierText = String(raw || '').trim();

  const tierStr = tierText.match(/第\s*([一二三四五六七1-7])\s*[层層][级級]/);
  if (tierStr) {
    const token = tierStr[1];
    return tierMap[token] || parseInt(token, 10) || 1;
  }

  const directDigit = tierText.match(/[1-7]/);
  if (directDigit) return parseInt(directDigit[0], 10) || 1;

  const directCn = tierText.match(/[一二三四五六七]/);
  if (directCn) return tierMap[directCn[0]] || 1;

  return parseInt(tierText, 10) || 1;
}

function normalizeRaceTextForLookup(race: string): string {
  let normalized = race;

  const aliasEntries = Object.entries(RACE_ALIAS_TO_SIMPLIFIED).sort((a, b) => b[0].length - a[0].length);
  aliasEntries.forEach(([from, to]) => {
    if (normalized.includes(from)) {
      normalized = normalized.split(from).join(to);
    }
  });

  return normalized;
}

function resolveRaceKey(race: string): string {
  const normalizedRace = normalizeRaceTextForLookup(race);

  let raceKey = '其他';
  for (const k of Object.keys(raceColorMap)) {
    if (race.includes(k) || normalizedRace.includes(k)) {
      raceKey = k;
      break;
    }
  }
  return raceKey;
}

export function resolveTheme(data: CharacterData): ThemeResolved {
  const tier = resolveTier(data.生命层级);
  const race = data.种族 || '其他';
  const raceKey = resolveRaceKey(race);

  const raceRawHex = raceColorMap[raceKey] || raceColorMap.其他;
  const tierRawHex = tierColorMap[tier] || tierColorMap[1];

  const raceHex = harmonizeAccent(raceRawHex, '#808080', 0.1, 84, 198);
  const tierHex = tierRawHex;

  return {
    tier,
    raceKey,
    raceHex,
    tierHex,
    raceRgb: hexToRgb(raceHex),
    tierRgb: hexToRgb(tierHex),
  };
}

export function applyTheme(theme: ThemeResolved, root: HTMLElement = document.documentElement): void {
  root.style.setProperty('--race-color', theme.raceHex);
  root.style.setProperty('--race-color-rgb', theme.raceRgb);
  root.style.setProperty('--tier-color', theme.tierHex);
  root.style.setProperty('--tier-color-rgb', theme.tierRgb);
}
