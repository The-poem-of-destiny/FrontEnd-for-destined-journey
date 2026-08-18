/**
 * 生成主题调色板单网页工具（theme-studio）
 * 运行: npx tsx tools/theme-studio/build.ts
 * 输出: tools/theme-studio/index.html（自包含，双击打开即可用）
 *
 * 功能：切换/编辑 8 个预设主题的颜色，实时预览状态栏 UI，导出更新后的 theme-presets.ts 代码。
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { ThemePresets, ThemeList } from '../../src/status/config/theme-presets';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** 变量分组（顺序 = 导出顺序，与 theme.d.ts 注释一致） */
const GROUPS: Array<{ label: string; comment: string; keys: string[] }> = [
  { label: '窗口容器', comment: '// 窗口容器', keys: ['windowBg', 'windowBorder'] },
  { label: '标题栏', comment: '// 标题栏', keys: ['titleBarBg', 'titleBarText', 'titleBarIcon', 'titleBarBtnHover'] },
  { label: 'Tab 栏', comment: '// Tab 栏', keys: ['tabBarBg', 'tabText', 'tabActiveText', 'tabIndicator', 'tabHoverBg'] },
  { label: '内容区域', comment: '// 内容区域', keys: ['contentBg', 'cardBg', 'cardBorder', 'surfaceMuted', 'overlayBg'] },
  { label: '文本颜色', comment: '// 文本颜色', keys: ['textPrimary', 'textSecondary', 'textMuted'] },
  { label: '资源条', comment: '// 资源条', keys: ['resourceHp', 'resourceMp', 'resourceSp', 'resourceExp', 'resourceText'] },
  { label: '品质颜色', comment: '// 品质颜色', keys: ['qualityCommon', 'qualityUnique', 'qualityMythic', 'qualityLegendary', 'qualityEpic', 'qualityRare', 'qualityUncommon'] },
  { label: '交互状态', comment: '// 交互状态', keys: ['primaryBg', 'primaryText', 'success', 'warning', 'error', 'errorText', 'errorSolidText'] },
  { label: '命定系统', comment: '// 命定系统', keys: ['affection', 'affectionBg', 'affectionText', 'tagPresent', 'tagPresentText', 'tagContract', 'tagContractText'] },
  { label: '登神长阶', comment: '// 登神长阶', keys: ['ascensionElement', 'ascensionPower', 'ascensionLaw'] },
  { label: '货币', comment: '// 货币', keys: ['currencyGold', 'currencySilver', 'currencyCopper'] },
];

const ALL_KEYS = GROUPS.flatMap(g => g.keys);

/** 主题常量名（与 theme-presets.ts 的命名一致） */
const CONST_NAMES: Record<string, string> = {
  parchment: 'ParchmentTheme',
  crimson: 'CrimsonTheme',
  indigo: 'IndigoTheme',
  bronze: 'BronzeTheme',
  sakura: 'SakuraTheme',
  obsidian: 'ObsidianTheme',
  ivory: 'IvoryTheme',
  'misty-lilac': 'MistyLilacTheme',
};

/** 主题列表顺序（与 ThemeList 一致） */
const ORDER = ThemeList.map(t => t.id);
const DATA = ORDER.map(id => ({ id, name: ThemePresets[id].name, colors: ThemePresets[id].colors }));

const html = String.raw`
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>状态栏主题调色板</title>
<style>
:root { --panel-bg: #17181c; --panel-bg2: #1e2026; --panel-border: #33363f; --text: #d6d8de; --text-muted: #8b8f99; --accent: #8f9fff; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--panel-bg); color: var(--text); font: 13px/1.5 system-ui, 'Noto Sans SC', sans-serif; overflow: hidden; }
.app { display: flex; flex-direction: column; height: 100vh; }
.toolbar { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--panel-border); background: var(--panel-bg2); flex-wrap: wrap; }
.toolbar h1 { font-size: 14px; font-weight: 600; margin-right: 8px; }
.pill { padding: 4px 12px; border: 1px solid var(--panel-border); border-radius: 999px; background: transparent; color: var(--text-muted); cursor: pointer; font-size: 12px; transition: all .15s; }
.pill:hover { border-color: var(--accent); color: var(--text); }
.pill.active { background: var(--accent); border-color: var(--accent); color: #10131a; font-weight: 600; }
.spacer { flex: 1; }
.btn { padding: 5px 14px; border-radius: 6px; border: 1px solid var(--panel-border); background: transparent; color: var(--text); cursor: pointer; font-size: 12px; transition: all .15s; }
.btn:hover { border-color: var(--accent); }
.btn.primary { background: var(--accent); border-color: var(--accent); color: #10131a; font-weight: 600; }
#btnPeek:active { background: var(--accent); border-color: var(--accent); color: #10131a; }
.main { flex: 1; display: flex; min-height: 0; }
.editor { width: 320px; min-width: 260px; overflow-y: auto; border-right: 1px solid var(--panel-border); padding: 8px; background: var(--panel-bg2); }
.group { margin-bottom: 6px; }
.group-head { display: flex; align-items: center; gap: 6px; padding: 6px 8px; cursor: pointer; border-radius: 6px; user-select: none; font-size: 12px; color: var(--text-muted); }
.group-head:hover { background: rgba(255,255,255,.04); }
.group-head .arrow { transition: transform .15s; font-size: 9px; }
.group.collapsed .arrow { transform: rotate(-90deg); }
.group.collapsed .rows { display: none; }
.rows { padding: 2px 4px 6px; }
.row { display: grid; grid-template-columns: 22px 1fr auto; align-items: center; gap: 2px 6px; padding: 3px 4px; border-radius: 5px; }
.row:hover { background: rgba(255,255,255,.04); }
.swatch { width: 20px; height: 20px; border-radius: 4px; border: 1px solid rgba(255,255,255,.18); cursor: pointer; position: relative; overflow: hidden; }
.swatch input { position: absolute; inset: -6px; width: 32px; height: 32px; opacity: 0; cursor: pointer; border: none; }
.row-info { min-width: 0; }
.row-name { font-size: 12px; }
.row-var { font-size: 10px; color: var(--text-muted); font-family: ui-monospace, monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row input[type=text] { width: 92px; padding: 3px 5px; border: 1px solid var(--panel-border); border-radius: 4px; background: var(--panel-bg); color: var(--text); font-size: 11px; font-family: ui-monospace, monospace; outline: none; }
.row input[type=text]:focus { border-color: var(--accent); }
.alpha-row { grid-column: 1 / -1; display: flex; align-items: center; gap: 6px; padding: 0 2px 2px 24px; }
.alpha-row .alpha-label { font-size: 10px; color: var(--text-muted); min-width: 14px; }
.alpha-row input[type=range] { flex: 1; min-width: 0; accent-color: var(--accent); }
.alpha-row .alpha-val { font-size: 10px; color: var(--text-muted); min-width: 36px; text-align: right; font-family: ui-monospace, monospace; }
.row input[type=text].expr { width: 110px; font-size: 9px; }
.preview-wrap { flex: 1; display: flex; flex-direction: column; min-width: 0; background:
  repeating-conic-gradient(#1b1d22 0% 25%, #202229 0% 50%) 0 0/24px 24px; overflow: auto; padding: 18px; }
.preview-view { display: flex; gap: 16px; justify-content: center; align-items: flex-start; margin: auto; flex-wrap: wrap; }
.phone { flex: 1 1 300px; min-width: 280px; max-width: 400px; }
.window { border: 1px solid color-mix(in srgb, var(--theme-window-border) 72%, transparent); border-radius: 10px; overflow: hidden; background: var(--theme-window-bg); font-family: 'Noto Sans SC', sans-serif; box-shadow: 0 12px 40px rgba(0,0,0,.45); }
.window::before { content: ''; display: block; height: 0; }
.titlebar { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: color-mix(in srgb, var(--theme-title-bar-bg) 88%, rgba(255,255,255,.03)); border-bottom: 1px solid color-mix(in srgb, var(--theme-window-border) 68%, transparent); }
.titlebar .info { display: flex; flex-direction: column; gap: 3px; color: var(--theme-title-bar-text); font-size: 12px; }
.titlebar .info span { display: inline-flex; align-items: center; gap: 5px; min-height: 18px; }
.titlebar .info svg { color: var(--theme-title-bar-icon); width: 11px; height: 11px; flex-shrink: 0; fill: currentColor; }
.titlebar .acts { display: flex; gap: 5px; }
.titlebar .acts .icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 999px; background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.05); color: var(--theme-title-bar-icon); }
.titlebar .acts .icon svg { width: 13px; height: 13px; fill: currentColor; }
.tabbar { display: flex; border-bottom: 1px solid color-mix(in srgb, var(--theme-window-border) 62%, transparent); padding: 0 10px; background: var(--theme-tab-bar-bg); }
.tabbar .tab { flex: 1; min-width: 0; display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 10px 6px 9px; color: var(--theme-tab-text); font-size: 12px; font-weight: 500; position: relative; cursor: pointer; white-space: nowrap; }
.tabbar .tab svg { width: 11px; height: 11px; fill: currentColor; opacity: .72; flex-shrink: 0; }
.tabbar .tab.active { color: var(--theme-tab-active-text); font-weight: 600; }
.tabbar .tab.active svg { opacity: 1; }
.tabbar .tab.active::after { content: ''; position: absolute; left: 8px; right: 8px; bottom: -1px; height: 2px; border-radius: 999px; background: var(--theme-tab-indicator); }
.tabbar .tab:hover { color: var(--theme-tab-active-text); }
.content { padding: 12px; background: var(--theme-content-bg); min-height: 340px; }
.card { border: 1px solid color-mix(in srgb, var(--theme-card-border) 68%, transparent); border-radius: 8px; background: color-mix(in srgb, var(--theme-card-bg) 62%, transparent); padding: 8px 10px; }
.card + .card { margin-top: 8px; }
.card-title { font-size: 11px; color: var(--theme-text-muted); margin-bottom: 6px; letter-spacing: .3px; }

/* 信息页：资源条 */
.res-bar { display: grid; grid-template-columns: 28px 1fr 36px; align-items: center; gap: 6px; padding: 3px 0; font-size: 11px; }
.res-bar .res-ico { width: 18px; height: 18px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; }
.res-bar .res-track { height: 7px; border-radius: 999px; background: color-mix(in srgb, var(--theme-card-border) 45%, transparent); overflow: hidden; }
.res-bar .res-fill { height: 100%; border-radius: 999px; }
.res-bar .res-val { text-align: right; font-weight: 600; color: var(--theme-resource-text); }
.attr-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; }
.attr-item { display: flex; align-items: center; justify-content: space-between; min-height: 30px; padding: 4px 6px; border-radius: 6px; background: color-mix(in srgb, var(--theme-card-border) 22%, transparent); font-size: 11px; }
.attr-item .attr-k { display: flex; align-items: center; gap: 5px; color: var(--theme-text-secondary); }
.attr-item .attr-dot { width: 9px; height: 9px; border-radius: 50%; background: color-mix(in srgb, var(--theme-tab-indicator) 78%, var(--theme-text-secondary) 22%); }
.attr-item .attr-v { font-size: 15px; font-weight: 800; color: var(--theme-text-primary); }
.effect-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.effect-chip { font-size: 10px; padding: 2px 7px; border-radius: 999px; border: 1px solid; display: inline-flex; gap: 4px; align-items: center; }
.effect-chip.buff { border-color: color-mix(in srgb, var(--theme-success) 42%, var(--theme-card-border) 58%); background: color-mix(in srgb, var(--theme-success) 12%, var(--theme-card-bg) 88%); color: var(--theme-text-secondary); }
.effect-chip.debuff { border-color: color-mix(in srgb, var(--theme-error) 42%, var(--theme-card-border) 58%); background: color-mix(in srgb, var(--theme-error) 12%, var(--theme-card-bg) 88%); color: var(--theme-text-secondary); }
.effect-chip.special { border-color: color-mix(in srgb, var(--theme-warning) 42%, var(--theme-card-border) 58%); background: color-mix(in srgb, var(--theme-warning) 12%, var(--theme-card-bg) 88%); color: var(--theme-text-secondary); }
.effect-chip .st { font-size: 9px; opacity: .7; }

/* 持有物页 */
.item-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; border: 1px solid color-mix(in srgb, var(--theme-card-border) 55%, transparent); background: color-mix(in srgb, var(--theme-card-bg) 45%, transparent); margin-bottom: 5px; }
.item-row:hover { border-color: color-mix(in srgb, var(--theme-card-border) 90%, transparent); }
.item-qm { width: 8px; height: 8px; border-radius: 999px; background: var(--q-color, var(--theme-quality-common)); flex-shrink: 0; }
.item-main { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; }
.item-name { font-size: 12px; color: var(--q-color, var(--theme-quality-common)); font-weight: 600; }
.item-type { font-size: 10px; color: var(--theme-text-muted); padding: 1px 6px; border: 1px solid color-mix(in srgb, var(--theme-card-border) 55%, transparent); border-radius: 999px; }
.item-meta { font-size: 11px; color: var(--theme-text-muted); flex-shrink: 0; }
.quality-row { display: flex; flex-wrap: wrap; gap: 4px; }
.quality-swatch { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; padding: 2px 6px; border-radius: 4px; border: 1px solid color-mix(in srgb, var(--theme-card-border) 55%, transparent); color: var(--theme-text-secondary); }
.quality-swatch .dot { width: 8px; height: 8px; border-radius: 50%; }

/* 命定页 */
.partner-card { border: 1px solid color-mix(in srgb, var(--theme-card-border) 68%, transparent); border-radius: 8px; background: color-mix(in srgb, var(--theme-card-bg) 62%, transparent); padding: 10px; margin-bottom: 8px; }
.partner-head { display: flex; align-items: center; justify-content: space-between; }
.partner-name { font-size: 13px; font-weight: 600; color: var(--theme-text-primary); }
.partner-tags { display: flex; gap: 4px; margin-top: 5px; }
.tag { font-size: 10px; padding: 2px 8px; border-radius: 999px; }
.tag.present { background: var(--theme-tag-present); color: var(--theme-tag-present-text); }
.tag.contract { background: var(--theme-tag-contract); color: var(--theme-tag-contract-text); }
.aff-row { display: grid; grid-template-columns: 46px 1fr 34px; align-items: center; gap: 6px; margin-top: 8px; font-size: 10px; color: var(--theme-text-muted); }
.aff-track { height: 6px; border-radius: 999px; background: var(--theme-affection-bg); overflow: hidden; }
.aff-fill { height: 100%; border-radius: 999px; background: var(--theme-affection); }
.aff-val { text-align: right; color: var(--theme-affection-text); font-weight: 600; }
.money-row { display: flex; gap: 8px; font-size: 11px; }
.money-row .m { display: inline-flex; align-items: center; gap: 3px; }
.money-row .m svg { width: 10px; height: 10px; fill: currentColor; }
.money-row .gold { color: var(--theme-currency-gold); }
.money-row .silver { color: var(--theme-currency-silver); }
.money-row .copper { color: var(--theme-currency-copper); }
.toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(80px); background: var(--accent); color: #10131a; font-weight: 600; padding: 8px 18px; border-radius: 8px; transition: transform .2s; z-index: 99; }
.toast.show { transform: translateX(-50%) translateY(0); }
</style>
</head>
<body>
<div class="app">
  <div class="toolbar">
    <h1>状态栏主题调色板</h1>
    <div id="pills"></div>
    <div class="spacer"></div>
    <button class="btn" id="btnUndo">撤销</button>
    <button class="btn" id="btnPeek">按住查看原方案</button>
    <button class="btn" id="btnReset">重置当前主题</button>
    <button class="btn primary" id="btnExport">导出 TS 代码</button>
  </div>
  <div class="main">
    <div class="editor" id="editor"></div>
    <div class="preview-wrap">
      <div class="preview-view" id="previewHost"></div>
    </div>
  </div>
</div>
<div class="toast" id="toast"></div>
<script>
const GROUPS = ${JSON.stringify(GROUPS, null, 2)};
const THEMES = ${JSON.stringify(DATA, null, 2)};
const CONST_NAMES = ${JSON.stringify(CONST_NAMES, null, 2)};
const ORDER = ${JSON.stringify(ORDER, null, 2)};

let currentId = ORDER[0];
let working = JSON.parse(JSON.stringify(THEMES)); // 修改中的副本 {id,name,colors}
let peeking = false; // 按住"查看原方案"按钮时，预览切回预设色
let undoStack = []; // 修改前快照 [{id, key, colors}]

/** 当前预览用的主题：peeking 时用预设原色，否则用临时修改 */
function getCurrentTheme() {
  const src = peeking ? THEMES : working;
  return src.find(t => t.id === currentId);
}

/** 记录当前主题修改前的颜色快照（同一字段连续修改合并为一次，拖动取色器只记一次） */
function recordUndo(key) {
  const top = undoStack[undoStack.length - 1];
  if (top && top.id === currentId && top.key === key) return;
  undoStack.push({
    id: currentId,
    key,
    colors: JSON.parse(JSON.stringify(working.find(t => t.id === currentId).colors)),
  });
  if (undoStack.length > 50) undoStack.shift();
}

/** 撤销最近一次修改 */
function undo() {
  const entry = undoStack.pop();
  if (!entry) {
    toast('没有可撤销的修改');
    return;
  }
  const target = working.find(t => t.id === entry.id);
  target.colors = entry.colors;
  if (entry.id === currentId) {
    applyTheme(getCurrentTheme());
    renderEditor();
    renderPreview();
  }
  toast('已撤销');
}

const isHex = v => /^#[0-9a-fA-F]{6}$/.test(v);
const isRgba = v => /^rgba?\(/.test(v);
const isExpr = v => typeof v === 'string' && !isHex(v) && !isRgba(v);
/** 值转 CSS 变量色：color-mix 表达式里的 var() 引用当前主题 */
const resolveVal = v => v;

function kebab(key) { return key.replace(/([A-Z])/g, '-$1').toLowerCase(); }

function applyTheme(theme) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.colors)) {
    root.style.setProperty('--theme-' + kebab(key), String(value));
  }
  const bg = theme.colors.windowBg;
  const m = /^#([0-9a-f]{6})$/i.exec(bg || '');
  let mode = 'dark';
  if (m) {
    const c = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16) / 255);
    mode = (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) > 0.5 ? 'light' : 'dark';
  }
  root.dataset.themeMode = mode;
}

function renderPills() {
  const host = document.getElementById('pills');
  host.innerHTML = '';
  for (const t of THEMES) {
    const b = document.createElement('button');
    b.className = 'pill' + (t.id === currentId ? ' active' : '');
    b.textContent = t.name;
    b.onclick = () => selectTheme(t.id);
    host.appendChild(b);
  }
}

function selectTheme(id) {
  currentId = id;
  applyTheme(getCurrentTheme());
  renderPills();
  renderEditor();
  renderPreview();
}

function colorType(v) {
  if (isHex(v) || isRgba(v)) return 'color';
  return 'expr';
}

/** 解析 hex / rgba 颜色，返回 {r,g,b,a}；不支持则返回 null */
function parseColor(v) {
  if (isHex(v)) {
    return {
      r: parseInt(v.slice(1, 3), 16),
      g: parseInt(v.slice(3, 5), 16),
      b: parseInt(v.slice(5, 7), 16),
      a: 1,
    };
  }
  const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+%?)\s*)?\)$/i.exec(v);
  if (m) {
    return {
      r: Math.round(+m[1]),
      g: Math.round(+m[2]),
      b: Math.round(+m[3]),
      a: m[4] === undefined ? 1 : m[4].endsWith('%') ? +m[4].slice(0, -1) / 100 : +m[4],
    };
  }
  return null;
}

/** 由 {r,g,b,a} 生成颜色字符串：a>=1 输出 hex，否则 rgba */
function formatColor(c) {
  if (c.a >= 1) {
    const hex = [c.r, c.g, c.b].map(x => x.toString(16).padStart(2, '0')).join('');
    return '#' + hex;
  }
  return 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + (Math.round(c.a * 100) / 100) + ')';
}

function renderEditor() {
  const host = document.getElementById('editor');
  const theme = working.find(t => t.id === currentId);
  host.innerHTML = '';
  for (const g of GROUPS) {
    const div = document.createElement('div');
    div.className = 'group';
    const head = document.createElement('div');
    head.className = 'group-head';
    head.innerHTML = '<span class="arrow">▼</span>' + g.label + ' <span style="opacity:.5">(' + g.keys.length + ')</span>';
    head.onclick = () => div.classList.toggle('collapsed');
    div.appendChild(head);
    const rows = document.createElement('div');
    rows.className = 'rows';
    for (const key of g.keys) {
      const v = theme.colors[key];
      const ct = colorType(v);
      const parsed = ct === 'color' ? parseColor(v) : null;
      const row = document.createElement('div');
      row.className = 'row';
      const swatch = document.createElement('div');
      swatch.className = 'swatch';
      swatch.style.background = v;
      const cp = document.createElement('input');
      cp.type = 'color';
      cp.value = isHex(v) ? v : parsed ? formatColor({ ...parsed, a: 1 }) : '#888888';
      swatch.appendChild(cp);
      const info = document.createElement('div');
      info.className = 'row-info';
      info.innerHTML = '<div class="row-name">' + key + '</div><div class="row-var">--theme-' + kebab(key) + '</div>';
      const txt = document.createElement('input');
      txt.type = 'text';
      txt.value = v;
      txt.className = ct === 'expr' ? 'expr' : '';
      txt.oninput = () => {
        recordUndo(key);
        theme.colors[key] = txt.value;
        swatch.style.background = txt.value;
        afterEdit();
        const p = parseColor(txt.value);
        if (p) {
          const s = row.querySelector('.alpha-row input[type=range]');
          if (s) {
            s.value = Math.round(p.a * 100);
            row.querySelector('.alpha-row .alpha-val').textContent = Math.round(p.a * 100) + '%';
          }
        }
      };
      if (ct === 'expr') {
        cp.style.display = 'none';
      }
      row.appendChild(swatch);
      row.appendChild(info);
      row.appendChild(txt);
      if (ct === 'color') {
        // alpha 滑块：联动 color picker 与文本输入
        const alphaRow = document.createElement('div');
        alphaRow.className = 'alpha-row';
        const alphaLabel = document.createElement('span');
        alphaLabel.className = 'alpha-label';
        alphaLabel.textContent = 'α';
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 100;
        slider.step = 1;
        slider.value = parsed ? Math.round(parsed.a * 100) : 100;
        const alphaVal = document.createElement('span');
        alphaVal.className = 'alpha-val';
        alphaVal.textContent = slider.value + '%';
        slider.oninput = () => {
          recordUndo(key);
          const base = parseColor(theme.colors[key]) || { r: 255, g: 255, b: 255, a: 1 };
          theme.colors[key] = formatColor({ ...base, a: slider.value / 100 });
          swatch.style.background = theme.colors[key];
          txt.value = theme.colors[key];
          alphaVal.textContent = slider.value + '%';
          afterEdit();
        };
        cp.oninput = () => {
          recordUndo(key);
          const base = parseColor(cp.value) || { r: 255, g: 255, b: 255, a: 1 };
          theme.colors[key] = formatColor({ ...base, a: slider.value / 100 });
          swatch.style.background = theme.colors[key];
          txt.value = theme.colors[key];
          afterEdit();
        };
        alphaRow.appendChild(alphaLabel);
        alphaRow.appendChild(slider);
        alphaRow.appendChild(alphaVal);
        row.appendChild(alphaRow);
      } else {
        cp.oninput = () => { recordUndo(key); theme.colors[key] = cp.value; swatch.style.background = cp.value; txt.value = cp.value; afterEdit(); };
      }
      rows.appendChild(row);
    }
    div.appendChild(rows);
    host.appendChild(div);
  }
}

function afterEdit() {
  applyTheme(getCurrentTheme());
  renderPreview();
}

/* ---------- 预览 ---------- */

const svg = p => '<svg viewBox="0 0 24 24"><path d="' + p + '"/></svg>';
const ICONS = {
  clock: svg('M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.1.8-1.2-4.3-2.6V7z'),
  location: svg('M12 2C8.1 2 5 5.1 5 8.5c0 5.2 7 13 7 13s7-7.8 7-13C19 5.1 15.9 2 12 2zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5S13.4 11.5 12 11.5z'),
  refresh: svg('M17.6 6.4A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.2L13 11h7V4l-2.4 2.4z'),
  gear: svg('M19.1 12.9c0-.3.1-.6.1-.9s0-.6-.1-.9l2-1.6c.2-.1.3-.4.1-.6l-1.9-3.3c-.1-.2-.4-.3-.6-.2l-2.4 1c-.5-.4-1-.7-1.6-.9l-.4-2.5c0-.3-.2-.4-.5-.4h-3.8c-.2 0-.4.2-.5.4l-.4 2.5c-.6.2-1.1.5-1.6.9l-2.4-1c-.2-.1-.5 0-.6.2l-1.9 3.3c-.1.2 0 .5.1.6l2 1.6c-.1.3-.1.6-.1.9s0 .6.1.9l-2 1.6c-.2.1-.3.4-.1.6l1.9 3.3c.1.2.4.3.6.2l2.4-1c.5.4 1 .7 1.6.9l.4 2.5c.1.2.3.4.5.4h3.8c.2 0 .4-.2.5-.4l.4-2.5c.6-.2 1.1-.5 1.6-.9l2.4 1c.2.1.5 0 .6-.2l1.9-3.3c.1-.2 0-.5-.1-.6l-2-1.6zm-7.1 2.7c-2 0-3.6-1.6-3.6-3.6s1.6-3.6 3.6-3.6 3.6 1.6 3.6 3.6-1.6 3.6-3.6 3.6z'),
  scroll: svg('M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'),
  user: svg('M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z'),
  briefcase: svg('M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 0h-4V4h4v2z'),
  star: svg('M12 17.3 18.2 21l-1.6-7 5.4-4.7-7.2-.6L12 2 9.2 8.7 2 9.3l5.4 4.7L5.8 21z'),
  newspaper: svg('M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 14H6v-2h9v2zm3-4H6v-2h12v2zm0-4H6V7h12v2z'),
  map: svg('M20.5 3 20 3.1 15 5.1 9 3 3.4 4.9c-.2.1-.4.3-.4.5v15.1c0 .3.2.5.5.5l.5-.1 5-2 6 2 5.6-1.9c.2-.1.4-.3.4-.5V3.5c0-.3-.2-.5-.5-.5zM15 19l-6-2.1V5l6 2.1V19z'),
  coin: svg('M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.3-4.4v-1.6c-1-.1-2.1-.5-2.9-1.3l.9-1.2c.9.9 2 1.3 3 1.3.9 0 1.6-.4 1.6-1.2 0-.9-1.1-1.1-2.4-1.3-1.5-.3-3-.8-3-2.5 0-1.3.9-2.2 2.5-2.5V6.9c.5.1 1.1.2 1.6.4l-.3 1.3c-.4-.2-.9-.3-1.3-.3-1 0-1.5.5-1.5 1.1 0 .8 1.2 1 2.6 1.3 1.5.3 2.9.8 2.9 2.7 0 1.3-1 2.4-2.6 2.6v1.6h-.6z'),
};
const ICON = (name) => ICONS[name] || '';

const QUALITY_KEYS = ['qualityCommon', 'qualityUnique', 'qualityMythic', 'qualityLegendary', 'qualityEpic', 'qualityRare', 'qualityUncommon'];
const QUALITY_LABELS = { qualityCommon: '普通', qualityUnique: '唯一', qualityMythic: '神话', qualityLegendary: '传说', qualityEpic: '史诗', qualityRare: '稀有', qualityUncommon: '精良' };

function renderWindow(tabs, body) {
  return '<div class="phone"><div class="window">' +
    '<div class="titlebar"><div class="info">' +
    '<span>' + ICON('clock') + '圣历 233 年 · 暮秋</span>' +
    '<span>' + ICON('location') + '王都 · 黎明酒馆</span></div>' +
    '<div class="acts"><div class="icon">' + ICON('refresh') + '</div><div class="icon">' + ICON('gear') + '</div></div></div>' +
    '<div class="tabbar">' + tabs + '</div>' +
    '<div class="content">' + body + '</div>' +
    '</div></div>';
}

function renderPreview() {
  const host = document.getElementById('previewHost');
  const c = getCurrentTheme().colors;
  const tabIcons = ['scroll', 'user', 'briefcase', 'star', 'newspaper', 'map'];
  const tabLabels = ['任务', '信息', '持有物', '命定', '新闻', '地图'];
  const makeTabs = activeIdx => tabLabels.map((l, i) =>
    '<div class="tab' + (i === activeIdx ? ' active' : '') + '">' + ICON(tabIcons[i]) + '<span>' + l + '</span></div>'
  ).join('');

  host.innerHTML =
    renderWindow(makeTabs(1), statusBody(c)) +
    renderWindow(makeTabs(2), itemsBody(c)) +
    renderWindow(makeTabs(3), destinyBody(c));
}

function statusBody(c) {
  const bars = [
    ['hp', '♥', c.resourceHp, 68],
    ['mp', '◆', c.resourceMp, 41],
    ['sp', '●', c.resourceSp, 87],
    ['exp', '★', c.resourceExp, 30],
  ].map(b =>
    '<div class="res-bar"><div class="res-ico" style="background:' + b[2] + '">' + b[1] + '</div>' +
    '<div class="res-track"><div class="res-fill" style="width:' + b[3] + '%;background:' + b[2] + '"></div></div>' +
    '<div class="res-val">' + b[3] + '/100</div></div>'
  ).join('');
  const attrs = [
    ['力量', 18], ['敏捷', 15], ['体质', 16], ['意志', 20],
    ['智力', 14], ['魅力', 17], ['幸运', 12], ['洞察', 19],
  ].map(a => '<div class="attr-item"><span class="attr-k"><span class="attr-dot"></span>' + a[0] + '</span><span class="attr-v">' + a[1] + '</span></div>').join('');
  const effects = [
    ['坚韧', '增益', 'buff', 'x2'], ['剧毒', '减益', 'debuff', 'x1'], ['鼓舞', '增益', 'buff', ''],
    ['虚弱', '减益', 'debuff', 'x3'], ['祝福', '特殊', 'special', ''],
  ].map(e => '<span class="effect-chip ' + e[2] + '">' + e[0] + '<span class="st">' + e[1] + (e[3] ? ' ' + e[3] : '') + '</span></span>').join('');
  return (
    '<div class="card"><div class="card-title">生命状态</div>' + bars + '</div>' +
    '<div class="card"><div class="card-title">属性</div><div class="attr-grid">' + attrs + '</div></div>' +
    '<div class="card"><div class="card-title">当前效果</div><div class="effect-chips">' + effects + '</div></div>'
  );
}

function itemsBody(c) {
  const items = [
    ['圣剑·斩星', '武器', '×1', c.qualityMythic],
    ['精钢长剑', '武器', '×1', c.qualityLegendary],
    ['旅者披风', '防具', '×1', c.qualityEpic],
    ['刻名银戒', '饰品', '×1', c.qualityUnique],
    ['治疗药水', '消耗品', '×5', c.qualityUncommon],
    ['古老地图残页', '任务道具', '×1', c.qualityRare],
    ['铜币袋', '杂物', '×12', c.qualityCommon],
  ].map(it =>
    '<div class="item-row"><div class="item-qm" style="--q-color:' + it[3] + '"></div>' +
    '<div class="item-main"><span class="item-name" style="--q-color:' + it[3] + '">' + it[0] + '</span>' +
    '<span class="item-type">' + it[1] + '</span></div><div class="item-meta">' + it[2] + '</div></div>'
  ).join('');
  const qualities = QUALITY_KEYS.map(k =>
    '<span class="quality-swatch"><span class="dot" style="background:' + c[k] + '"></span>' + QUALITY_LABELS[k] + '</span>'
  ).join('');
  return (
    '<div class="card"><div class="card-title">品质色</div><div class="quality-row">' + qualities + '</div></div>' +
    '<div class="card" style="margin-top:8px"><div class="card-title">背包</div>' + items + '</div>'
  );
}

function destinyBody(c) {
  const partner = (name, title, aff, tags) => {
    const t = tags.map(tag =>
      tag === '在场'
        ? '<span class="tag present">在场</span>'
        : '<span class="tag contract">命定契约</span>'
    ).join('');
    return '<div class="partner-card"><div class="partner-head"><span class="partner-name">' + name + '</span></div>' +
      '<div class="partner-tags">' + t + '</div>' +
      '<div class="aff-row"><span>好感度</span><div class="aff-track"><div class="aff-fill" style="width:' + aff + '%"></div></div><span class="aff-val">' + aff + '</span></div></div>';
  };
  return (
    '<div class="card"><div class="card-title">资产</div><div class="money-row">' +
    '<span class="m gold">' + ICON('coin') + '1,240</span>' +
    '<span class="m silver">' + ICON('coin') + '38</span>' +
    '<span class="m copper">' + ICON('coin') + '5</span></div></div>' +
    '<div style="margin-top:8px">' +
    partner('爱丽丝', '旅伴', 86, ['在场']) +
    partner('罗兰', '护卫', 64, ['在场', '命定契约']) +
    partner('梅林', '导师', 42, []) +
    '</div>'
  );
}

/* ---------- 导出 ---------- */

function exportTs() {
  const lines = [];
  lines.push('/**');
  lines.push(' * 预设主题配置');
  lines.push(' * 包含所有预设主题的颜色定义');
  lines.push(' */');
  lines.push("import type { Theme, ThemePresetId } from '../core/types/theme';");
  lines.push('');
  for (const id of ORDER) {
    const t = working.find(x => x.id === id);
    const cname = CONST_NAMES[id] || id[0].toUpperCase() + id.slice(1) + 'Theme';
    lines.push('/**');
    lines.push(' * ' + t.name + '主题');
    lines.push(' */');
    lines.push('const ' + cname + ': Theme = {');
    lines.push("  id: '" + id + "',");
    lines.push("  name: '" + t.name + "',");
    lines.push('  colors: {');
    for (const g of GROUPS) {
      lines.push('    ' + g.comment);
      for (const key of g.keys) {
        const v = t.colors[key];
        lines.push("    " + key + ": '" + String(v).replace(/'/g, "\\\\'") + "',");
      }
    }
    lines.push('  },');
    lines.push('};');
    lines.push('');
  }
  lines.push('/** 所有预设主题 */');
  lines.push('export const ThemePresets: Record<ThemePresetId, Theme> = {');
  for (const id of ORDER) lines.push("  " + id + ': ' + CONST_NAMES[id] + ',');
  lines.push('};');
  lines.push('');
  lines.push('/** 默认主题 */');
  lines.push('export const DefaultTheme = ' + CONST_NAMES['ivory'] + ';');
  lines.push('');
  lines.push('/** 主题列表（用于选择器） */');
  lines.push('export const ThemeList: Array<{ id: ThemePresetId; name: string }> = [');
  for (const id of ORDER) lines.push("  { id: '" + id + "', name: '" + THEMES.find(t => t.id === id).name + "' },");
  lines.push('];');
  return lines.join('\n');
}

/* ---------- 工具 ---------- */

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
}

document.getElementById('btnUndo').onclick = undo;

document.getElementById('btnReset').onclick = () => {
  recordUndo('__reset');
  const src = THEMES.find(t => t.id === currentId);
  const cur = working.find(t => t.id === currentId);
  cur.colors = JSON.parse(JSON.stringify(src.colors));
  applyTheme(getCurrentTheme());
  renderEditor();
  renderPreview();
  toast('已重置为预设值');
};

/* 按住查看原方案：按下切预设色，松开/移出/取消恢复临时色 */
const peekBtn = document.getElementById('btnPeek');
const stopPeek = () => {
  if (!peeking) return;
  peeking = false;
  applyTheme(getCurrentTheme());
  renderPreview();
};
peekBtn.addEventListener('pointerdown', e => {
  e.preventDefault();
  peeking = true;
  applyTheme(getCurrentTheme());
  renderPreview();
});
peekBtn.addEventListener('pointerup', stopPeek);
peekBtn.addEventListener('pointerleave', stopPeek);
peekBtn.addEventListener('pointercancel', stopPeek);

document.getElementById('btnExport').onclick = async () => {
  const code = exportTs();
  try {
    await navigator.clipboard.writeText(code);
    toast('已复制到剪贴板，替换 src/status/config/theme-presets.ts');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast('已复制到剪贴板，替换 src/status/config/theme-presets.ts');
  }
};

/* init */
applyTheme(getCurrentTheme());
renderPills();
renderEditor();
renderPreview();
</script>
</body>
</html>
`;

const outPath = resolve(__dirname, 'index.html');
writeFileSync(outPath, html);
console.log('已生成: ' + outPath);
