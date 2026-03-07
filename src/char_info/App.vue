<template>
  <div class="viewer-root">
    <div v-if="parseError" class="error-card">
      <h3>⚠️ YAML 解析失败</h3>
      <div class="error-body">
        <div class="yaml-error-row yaml-error-sub"><b>技术信息：</b>{{ parseError.message }}</div>
        <div v-if="parseError.line !== undefined" class="yaml-error-row">
          <b>定位：</b>第 {{ (parseError.line ?? 0) + 1 }} 行，第 {{ (parseError.column ?? 0) + 1 }} 列
        </div>

        <div v-if="parseErrorTips.length > 0" class="yaml-fix-box">
          <div class="yaml-fix-title">宝宝别急，三角老师带你一步步排查</div>
          <ul class="yaml-fix-list">
            <li v-for="tip in parseErrorTips" :key="tip">{{ tip }}</li>
          </ul>
        </div>

        <template v-if="parseError.cleanedLine">
          <div class="yaml-error-title">系统定位到的出错行（请重点检查）</div>
          <pre class="yaml-error-pre"
            >{{ parseError.cleanedLine }}
{{ parseError.caretLine }}</pre
          >
        </template>

        <details v-if="parseError.originalLine" class="yaml-error-details">
          <summary>查看你输入的原始内容（可选）</summary>
          <pre class="yaml-error-pre alt">{{ parseError.originalLine }}</pre>
        </details>
      </div>
    </div>

    <div v-else-if="sheetData" :class="wrapperClasses">
      <div class="frame-layer" :class="{ show: tierNumber >= 5 }" aria-hidden="true">
        <svg class="frame-svg frame-top" viewBox="0 0 400 100" preserveAspectRatio="none">
          <path d="M 5,100 A 195,80 0 0,1 395,100" />
          <path d="M 15,100 A 185,70 0 0,1 385,100" stroke-width="1" opacity="0.6" />
          <line x1="60" y1="60" x2="60" y2="90" stroke-width="1" />
          <line x1="340" y1="60" x2="340" y2="90" stroke-width="1" />
          <circle cx="60" cy="92" r="3" fill="var(--tier-color)" stroke="none" />
          <circle cx="340" cy="92" r="3" fill="var(--tier-color)" stroke="none" />
          <path
            d="M 200,2 L 205,15 L 220,20 L 205,25 L 200,38 L 195,25 L 180,20 L 195,15 Z"
            fill="var(--tier-color)"
            stroke="none"
          />
        </svg>
        <svg class="frame-svg frame-body" viewBox="0 0 400 100" preserveAspectRatio="none">
          <line x1="5" y1="0" x2="5" y2="100" />
          <line x1="395" y1="0" x2="395" y2="100" />
          <line x1="15" y1="0" x2="15" y2="98" stroke-width="1" opacity="0.6" />
          <line x1="385" y1="0" x2="385" y2="98" stroke-width="1" opacity="0.6" />
          <line x1="5" y1="100" x2="395" y2="100" />
        </svg>
      </div>

      <div ref="bgLayerRef" class="card-background-layer">
        <canvas id="particle-canvas" ref="canvasRef"></canvas>
      </div>

      <div class="sheet-content-wrapper">
        <header class="sheet-header">
          <span class="level-badge">Lv.{{ levelText }}</span>
          <h1 class="char-name">{{ nameText }}</h1>
          <div class="char-meta-row">
            <span>{{ raceText }}</span>
            <span class="meta-separator">◆</span>
            <span>{{ identityText }}</span>
            <span class="meta-separator">◆</span>
            <span>{{ classText }}</span>
            <span class="meta-separator">◆</span>
            <span class="tier-name">{{ tierText }}</span>
          </div>
        </header>

        <div class="sheet-body">
          <div class="attributes-grid">
            <div
              v-for="attr in attributes"
              :key="attr.key"
              class="attribute-item"
              :class="{ 'show-formula': attr.showFormula, 'has-formula': !!attr.formula }"
              @click="toggleAttributeFormula(attr.key)"
            >
              <span class="attribute-name">{{ attr.short }}</span>
              <span class="attribute-total">{{ attr.total }}</span>
              <span v-if="attr.formula" class="attribute-formula">{{ attr.formula }}</span>
            </div>
          </div>

          <div class="tab-nav">
            <button
              v-for="tab in visibleTabs"
              :key="tab.key"
              class="tab-button"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>

          <section class="tab-content">
            <template v-if="activeTab === 'profile'">
              <div class="profile-grid">
                <div class="profile-row">
                  <div class="profile-cell">
                    <template v-if="personalityText">
                      <h3 class="subsection-title">性格</h3>
                      <div class="story profile-panel">{{ personalityText }}</div>
                    </template>
                  </div>

                  <div class="profile-cell">
                    <template v-if="appearanceText">
                      <h3 class="subsection-title">外貌特质</h3>
                      <div class="story profile-panel">{{ appearanceText }}</div>
                    </template>
                  </div>
                </div>

                <div class="profile-row">
                  <div class="profile-cell">
                    <template v-if="likesText">
                      <h3 class="subsection-title">喜爱</h3>
                      <div class="story profile-panel">{{ likesText }}</div>
                    </template>
                  </div>

                  <div class="profile-cell">
                    <template v-if="attireText">
                      <h3 class="subsection-title">衣物装饰</h3>
                      <div class="story profile-panel">{{ attireText }}</div>
                    </template>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="activeTab === 'skills'">
              <article v-for="(item, index) in skills" :key="`skill-${index}-${itemName(item)}`" class="card">
                <div class="card-header">
                  <h3 class="card-title" :class="qualityClass(item)">{{ itemName(item) }}</h3>
                  <span v-if="itemQuality(item)" class="card-subtitle" :class="qualityClass(item)">{{
                    itemQuality(item)
                  }}</span>
                </div>
                <div class="card-body">
                  <div v-if="itemTags(item).length > 0" class="card-tags">
                    <span v-for="tag in itemTags(item)" :key="`skill-tag-${index}-${tag}`" class="card-tag">
                      {{ tag }}
                    </span>
                  </div>
                  <p v-if="itemType(item)"><span class="card-label">类型:</span>{{ itemType(item) }}</p>
                  <p v-if="itemCost(item)"><span class="card-label">消耗:</span>{{ itemCost(item) }}</p>
                  <template v-if="itemEffectEntries(item).length > 0">
                    <p><span class="card-label">效果:</span></p>
                    <ul class="effect-list">
                      <li
                        v-for="(entry, effectIndex) in itemEffectEntries(item)"
                        :key="`skill-effect-${index}-${effectIndex}-${entry.name}`"
                        class="effect-item"
                      >
                        <span v-if="!entry.fallback" class="effect-name">{{ entry.name }}</span>
                        <span class="effect-text">{{ entry.content }}</span>
                      </li>
                    </ul>
                  </template>
                  <p v-else><span class="card-label">效果:</span>无</p>
                  <p v-if="itemDescription(item)" class="card-description">{{ itemDescription(item) }}</p>
                </div>
              </article>
            </template>

            <template v-else-if="activeTab === 'equipment'">
              <article v-for="(item, index) in equipments" :key="`equip-${index}-${itemName(item)}`" class="card">
                <div class="card-header">
                  <h3 class="card-title" :class="qualityClass(item)">{{ itemName(item) }}</h3>
                  <span v-if="itemQuality(item)" class="card-subtitle" :class="qualityClass(item)">{{
                    itemQuality(item)
                  }}</span>
                </div>
                <div class="card-body">
                  <div v-if="itemTags(item).length > 0" class="card-tags">
                    <span v-for="tag in itemTags(item)" :key="`equip-tag-${index}-${tag}`" class="card-tag">
                      {{ tag }}
                    </span>
                  </div>
                  <p v-if="itemType(item)"><span class="card-label">类型:</span>{{ itemType(item) }}</p>
                  <template v-if="itemEffectEntries(item).length > 0">
                    <p><span class="card-label">效果:</span></p>
                    <ul class="effect-list">
                      <li
                        v-for="(entry, effectIndex) in itemEffectEntries(item)"
                        :key="`equip-effect-${index}-${effectIndex}-${entry.name}`"
                        class="effect-item"
                      >
                        <span v-if="!entry.fallback" class="effect-name">{{ entry.name }}</span>
                        <span class="effect-text">{{ entry.content }}</span>
                      </li>
                    </ul>
                  </template>
                  <p v-else><span class="card-label">效果:</span>无</p>
                  <p v-if="itemDescription(item)" class="card-description">{{ itemDescription(item) }}</p>
                </div>
              </article>
            </template>

            <template v-else-if="activeTab === 'inventory'">
              <template v-for="section in inventorySections" :key="section.key">
                <h3 class="subsection-title">{{ section.title }}</h3>
                <article
                  v-for="(item, index) in section.items"
                  :key="`${section.key}-${index}-${itemName(item)}`"
                  class="card"
                >
                  <div class="card-header">
                    <h3 class="card-title" :class="qualityClass(item)">{{ itemName(item) }}</h3>
                    <span v-if="itemQuality(item)" class="card-subtitle" :class="qualityClass(item)">{{
                      itemQuality(item)
                    }}</span>
                  </div>
                  <div class="card-body">
                    <div v-if="itemTags(item).length > 0" class="card-tags">
                      <span v-for="tag in itemTags(item)" :key="`${section.key}-${index}-${tag}`" class="card-tag">
                        {{ tag }}
                      </span>
                    </div>
                    <p v-if="itemType(item)"><span class="card-label">类型:</span>{{ itemType(item) }}</p>
                    <template v-if="itemEffectEntriesOrDescription(item).length > 0">
                      <p><span class="card-label">效果:</span></p>
                      <ul class="effect-list">
                        <li
                          v-for="(entry, effectIndex) in itemEffectEntriesOrDescription(item)"
                          :key="`${section.key}-${index}-${effectIndex}-${entry.name}`"
                          class="effect-item"
                        >
                          <span v-if="!entry.fallback" class="effect-name">{{ entry.name }}</span>
                          <span class="effect-text">{{ entry.content }}</span>
                        </li>
                      </ul>
                    </template>
                    <p v-else><span class="card-label">效果:</span>无</p>
                    <p v-if="itemDescription(item) && itemEffectEntries(item).length > 0" class="card-description">
                      {{ itemDescription(item) }}
                    </p>
                  </div>
                </article>
              </template>
            </template>

            <template v-else-if="activeTab === 'divinity'">
              <h3 v-if="divinityGodTitle" class="subsection-title divinity-main-title">{{ divinityGodTitle }}</h3>

              <article v-if="divinityKingdom" class="card divinity-card">
                <div class="card-header">
                  <h3 class="card-title">{{ divinityKingdom.name }}</h3>
                </div>
                <div class="card-body">
                  <p>{{ divinityKingdom.description || '无' }}</p>
                </div>
              </article>

              <template v-if="divinityElements.length > 0">
                <h3 class="subsection-title">要素</h3>
                <article
                  v-for="(item, index) in divinityElements"
                  :key="`elem-${index}-${itemName(item)}`"
                  class="card divinity-card"
                >
                  <div class="card-header">
                    <h3 class="card-title">{{ itemName(item) }}</h3>
                  </div>
                  <div class="card-body">
                    <p>{{ itemEffectOrDescription(item) }}</p>
                  </div>
                </article>
              </template>

              <template v-if="divinityPowers.length > 0">
                <h3 class="subsection-title">权能</h3>
                <article
                  v-for="(item, index) in divinityPowers"
                  :key="`power-${index}-${itemName(item)}`"
                  class="card divinity-card"
                >
                  <div class="card-header">
                    <h3 class="card-title">{{ itemName(item) }}</h3>
                  </div>
                  <div class="card-body">
                    <p>{{ itemEffectOrDescription(item) }}</p>
                  </div>
                </article>
              </template>

              <template v-if="divinityLaws.length > 0">
                <h3 class="subsection-title">法则</h3>
                <article
                  v-for="(item, index) in divinityLaws"
                  :key="`law-${index}-${itemName(item)}`"
                  class="card divinity-card"
                >
                  <div class="card-header">
                    <h3 class="card-title">{{ itemName(item) }}</h3>
                  </div>
                  <div class="card-body">
                    <p v-if="itemDescription(item)">{{ itemDescription(item) }}</p>
                    <p v-if="lawPassive(item)"><span class="card-label">被动:</span>{{ lawPassive(item) }}</p>
                    <p v-if="lawActive(item)"><span class="card-label">主动:</span>{{ lawActive(item) }}</p>
                  </div>
                </article>
              </template>
            </template>

            <template v-else>
              <div class="story">{{ backstoryText || '暂无故事' }}</div>
            </template>
          </section>
        </div>

        <button id="import-action-btn" :disabled="importing" @click.stop="toggleImportMenu">
          {{ importButtonText }}
        </button>
        <div id="import-action-menu" :class="{ show: showImportMenu }">
          <button type="button" :disabled="importing" @click="onImportMvu">导入到 MVU 变量</button>
          <button type="button" :disabled="importing" @click="onImportWorldbook">导入到 聊天世界书</button>
        </div>
      </div>
    </div>

    <div v-else class="loading-card">等待 YAML 数据...</div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue';

import { getSmartArray, hasArrayContent, hasText, parseAttributeValue } from './services/common';
import { importToMvuVariables, saveToChatWorldbook } from './services/importService';
import { createParticleEngine, type ParticleEngine } from './services/particleEngine';
import { applyTheme, resolveTheme } from './services/themeService';
import { parseCharacterYaml } from './services/yamlParser';
import type { CharacterData, FriendlyYamlError, ThemeResolved } from './types';

type TabKey = 'profile' | 'skills' | 'equipment' | 'inventory' | 'divinity' | 'backstory';

type ViewTab = {
  key: TabKey;
  label: string;
};

type ItemObject = Record<string, any>;

const tabOrder: ViewTab[] = [
  { key: 'profile', label: '档案' },
  { key: 'skills', label: '技能' },
  { key: 'equipment', label: '装备' },
  { key: 'inventory', label: '物品' },
  { key: 'divinity', label: '登神长阶' },
  { key: 'backstory', label: '背景故事' },
];

const sheetData = ref<CharacterData | null>(null);
const parseError = ref<FriendlyYamlError | null>(null);
const originalYamlText = ref('');
const theme = ref<ThemeResolved | null>(null);
const activeTab = ref<TabKey>('profile');

const canvasRef = ref<HTMLCanvasElement | null>(null);
const bgLayerRef = ref<HTMLElement | null>(null);
let engine: ParticleEngine | null = null;

const showImportMenu = ref(false);
const importing = ref(false);
const importButtonText = ref('📥');

const parseErrorReason = computed(() => {
  const message = String(parseError.value?.message || '').toLowerCase();

  if (message.includes('indent')) {
    return '这一行的前置空格层级不对（缩进错误）';
  }
  if (message.includes('mapping')) {
    return '“键: 值”的格式有问题（通常是冒号或内容写法不对）';
  }
  if (message.includes('unexpected') || message.includes('end of the stream')) {
    return '内容可能缺少引号、括号，或上一行没有正确结束。';
  }

  return '格式不符合要求，请按定位行号检查';
});

const parseErrorTips = computed(() => [
  '1. 先看这行里小箭头 ^ 指着哪里，就改那里',
  '2. 看"键: 值"的格式有沒有问题（通常是多了个冒号或内容写法不对）',
  '3. 看这一行开头前面的空格，尽量和附近长得像的行保持一样多（缩进错误）',
  '4. 内容可能缺少引号、括号，或上一行没有正确结束',
]);

const attributeLabelMap: Record<string, string> = {
  力量: '力',
  敏捷: '敏',
  体质: '体',
  智力: '智',
  精神: '精',
};

const tierNumber = computed(() => theme.value?.tier ?? 1);
const wrapperClasses = computed(() => ({
  'card-wrapper': true,
  [`tier-${tierNumber.value}`]: true,
  'high-tier': tierNumber.value >= 5,
}));

function pickField(source: unknown, ...keys: string[]): unknown {
  if (!source || typeof source !== 'object') return undefined;
  const obj = source as Record<string, unknown>;
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

const nameText = computed(() => String(pickField(sheetData.value, '姓名') || 'Unknown'));
const levelText = computed(() => String(pickField(sheetData.value, '等级', '等级') ?? '?'));
const raceText = computed(() => String(pickField(sheetData.value, '种族', '种族') || '其他'));
const tierText = computed(() => String(pickField(sheetData.value, '生命层级', '生命层级') || 'Unknown'));

const identityText = computed(() => getSmartArray(pickField(sheetData.value, '身份')).join(' / ') || '-');
const classText = computed(() => getSmartArray(pickField(sheetData.value, '职业', '职业')).join(' / ') || '-');

const personalityText = computed(() => {
  const val = pickField(sheetData.value, '性格');
  if (!val) return '';
  return Array.isArray(val) ? val.join('，') : String(val);
});

const likesText = computed(() => {
  const tags = getSmartArray(pickField(sheetData.value, '喜爱', '喜爱'))
    .map(tag => tag.trim().replace(/。+$/g, '').trim())
    .filter(Boolean);
  return tags.join('，');
});

const appearanceText = computed(() => String(pickField(sheetData.value, '外貌特质', '外貌特质') || '').trim());
const attireText = computed(() => String(pickField(sheetData.value, '衣物装饰', '衣物装饰') || '').trim());
const backstoryText = computed(() => String(pickField(sheetData.value, '背景故事') || '').trim());

const attributeFormulaState = ref<Record<string, boolean>>({});

function parseAttributeDisplay(rawValue: unknown): { total: string; formula: string } {
  if (rawValue === undefined || rawValue === null) return { total: '0', formula: '' };

  const text = String(rawValue).trim();
  if (!text) return { total: '0', formula: '' };

  if (!text.includes('=')) {
    return { total: String(parseAttributeValue(text)), formula: '' };
  }

  const parts = text.split('=');
  const formula = parts.slice(0, -1).join('=').trim();
  const totalPart = parts[parts.length - 1]?.trim() || '';

  return {
    total: totalPart || String(parseAttributeValue(text)),
    formula,
  };
}

const attributeAliasMap: Record<string, string[]> = {
  力量: ['力量'],
  敏捷: ['敏捷'],
  体质: ['体质', '体质'],
  智力: ['智力'],
  精神: ['精神'],
};

function getAttributeRawValue(attrObj: Record<string, unknown>, key: string): unknown {
  const aliases = attributeAliasMap[key] || [key];
  for (const alias of aliases) {
    const value = attrObj[alias];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

const attributes = computed(() => {
  const attrObj = (pickField(sheetData.value, '属性', '属性') || {}) as Record<string, unknown>;
  return ['力量', '敏捷', '体质', '智力', '精神'].map(key => {
    const parsed = parseAttributeDisplay(getAttributeRawValue(attrObj, key));
    return {
      key,
      short: attributeLabelMap[key] || key,
      total: parsed.total,
      formula: parsed.formula,
      showFormula: !!parsed.formula && !!attributeFormulaState.value[key],
    };
  });
});

function toggleAttributeFormula(key: string) {
  const attrObj = (pickField(sheetData.value, '属性', '属性') || {}) as Record<string, unknown>;
  const parsed = parseAttributeDisplay(getAttributeRawValue(attrObj, key));
  if (!parsed.formula) return;

  attributeFormulaState.value = {
    ...attributeFormulaState.value,
    [key]: !attributeFormulaState.value[key],
  };
}

function asObjectArray(input: unknown): ItemObject[] {
  if (!Array.isArray(input)) return [];
  return input.filter(item => item && typeof item === 'object') as ItemObject[];
}

function textFromUnknown(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value
      .map(v => textFromUnknown(v))
      .filter(Boolean)
      .join(' / ');
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => {
        const content = textFromUnknown(val);
        return content ? `${key}: ${content}` : '';
      })
      .filter(Boolean);
    return entries.join('； ');
  }
  return String(value);
}

type EffectEntry = {
  name: string;
  content: string;
  fallback: boolean;
};

function parseNamedEffectLine(line: string): EffectEntry | null {
  const normalized = String(line || '').trim();
  if (!normalized) return null;

  const bracketMatch = normalized.match(/^\[([^\]]+)\]\s*[：:]\s*(.*)$/);
  if (bracketMatch) {
    const name = String(bracketMatch[1] || '').trim();
    const content = String(bracketMatch[2] || '').trim();
    if (name && content) return { name, content, fallback: false };
    return null;
  }

  const splitIndex = normalized.search(/[：:]/);
  if (splitIndex <= 0) return null;

  const name = normalized.slice(0, splitIndex).trim();
  const content = normalized.slice(splitIndex + 1).trim();
  if (!name || !content) return null;

  return { name, content, fallback: false };
}

function parseEffectTextEntries(raw: string): EffectEntry[] {
  const text = String(raw || '')
    .replace(/\r\n/g, '\n')
    .trim();
  if (!text) return [];

  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const entries: EffectEntry[] = [];
  const remains: string[] = [];

  lines.forEach(line => {
    const named = parseNamedEffectLine(line);
    if (named) {
      entries.push(named);
      return;
    }
    remains.push(line);
  });

  if (entries.length === 0) {
    return [{ name: '描述', content: text, fallback: true }];
  }

  if (remains.length > 0) {
    entries.push({ name: '描述', content: remains.join('\n'), fallback: true });
  }

  return entries;
}

function normalizeEffectEntries(value: unknown): EffectEntry[] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>)
      .map(([name, raw]) => {
        const safeName = String(name || '').trim() || '描述';
        const content = textFromUnknown(raw).trim();
        return {
          name: safeName,
          content,
          fallback: safeName === '描述',
        };
      })
      .filter(entry => entry.content.length > 0);
  }

  return parseEffectTextEntries(textFromUnknown(value));
}

function formatEffectEntries(entries: EffectEntry[]): string {
  if (entries.length === 0) return '无';
  if (entries.length === 1) {
    const entry = entries[0];
    return entry.fallback ? entry.content : `${entry.name}: ${entry.content}`;
  }

  return entries.map(entry => (entry.fallback ? entry.content : `${entry.name}: ${entry.content}`)).join('\n');
}

function itemEffectEntries(item: ItemObject): EffectEntry[] {
  return normalizeEffectEntries(item?.效果);
}

function itemEffectEntriesOrDescription(item: ItemObject): EffectEntry[] {
  const entries = itemEffectEntries(item);
  if (entries.length > 0) return entries;

  const description = itemDescription(item);
  if (!description) return [];
  return [{ name: '描述', content: description, fallback: true }];
}

function itemName(item: ItemObject): string {
  return textFromUnknown(item?.名称) || '未命名';
}

function itemQuality(item: ItemObject): string {
  return textFromUnknown(item?.品质 || item?.稀有度);
}

function qualityClass(item: ItemObject): string {
  const quality = itemQuality(item).toLowerCase();
  if (!quality) return '';

  if (quality.includes('神话') || quality.includes('神話') || quality.includes('myth')) return 'quality-mythic';
  if (quality.includes('传说') || quality.includes('傳說') || quality.includes('legend')) return 'quality-legendary';
  if (quality.includes('史诗') || quality.includes('史詩') || quality.includes('epic')) return 'quality-epic';
  if (quality.includes('稀有') || quality.includes('rare')) return 'quality-rare';
  if (
    quality.includes('优良') ||
    quality.includes('優良') ||
    quality.includes('优秀') ||
    quality.includes('優秀') ||
    quality.includes('精良') ||
    quality.includes('uncommon')
  ) {
    return 'quality-uncommon';
  }
  if (quality.includes('普通') || quality.includes('common')) return 'quality-common';

  return '';
}

function itemType(item: ItemObject): string {
  return textFromUnknown(item?.类型 || item?.分类);
}

function itemDescription(item: ItemObject): string {
  return textFromUnknown(item?.描述);
}

function itemEffect(item: ItemObject): string {
  return formatEffectEntries(itemEffectEntries(item));
}

function itemEffectOrDescription(item: ItemObject): string {
  return formatEffectEntries(itemEffectEntriesOrDescription(item));
}

function itemTags(item: ItemObject): string[] {
  return getSmartArray(item?.标签);
}

function itemCost(item: ItemObject): string {
  const fromArray = getSmartArray(item?.消耗).join(' / ');
  if (fromArray) return fromArray;
  return textFromUnknown(item?.消耗);
}

function lawPassive(item: ItemObject): string {
  return textFromUnknown(item?.被动效果);
}

function lawActive(item: ItemObject): string {
  return textFromUnknown(item?.主动效果);
}

const skills = computed(() => asObjectArray(sheetData.value?.技能));
const equipments = computed(() => asObjectArray(sheetData.value?.装备));

const inventorySections = computed(() => {
  const all = [
    { key: 'props', title: '道具', items: asObjectArray(sheetData.value?.道具) },
    { key: 'special', title: '特殊物品', items: asObjectArray(sheetData.value?.特殊物品) },
    { key: 'items', title: '物品', items: asObjectArray(sheetData.value?.物品) },
  ];
  return all.filter(section => section.items.length > 0);
});

const divinityRoot = computed(() => {
  const raw = sheetData.value?.登神长阶;
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  return {} as Record<string, unknown>;
});

const divinityGodTitle = computed(() => {
  const fromRoot = textFromUnknown(divinityRoot.value?.神位);
  if (hasText(fromRoot)) return fromRoot;
  const fromTop = textFromUnknown(sheetData.value?.神位);
  return hasText(fromTop) ? fromTop : '';
});

const divinityKingdom = computed(() => {
  const raw = (divinityRoot.value?.神国 || sheetData.value?.神国) as unknown;
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const name = textFromUnknown(obj?.名称);
  const description = textFromUnknown(obj?.描述);
  if (!hasText(name) && !hasText(description)) return null;
  return {
    name: name || '神国',
    description,
  };
});

const divinityElements = computed(() => asObjectArray(divinityRoot.value?.要素 || sheetData.value?.要素));
const divinityPowers = computed(() => asObjectArray(divinityRoot.value?.权能 || sheetData.value?.权能));
const divinityLaws = computed(() => asObjectArray(divinityRoot.value?.法则 || sheetData.value?.法则));

const hasInventory = computed(() => inventorySections.value.length > 0);
const hasDivinity = computed(() => {
  return (
    hasText(divinityGodTitle.value) ||
    !!divinityKingdom.value ||
    hasArrayContent(divinityElements.value) ||
    hasArrayContent(divinityPowers.value) ||
    hasArrayContent(divinityLaws.value)
  );
});

const visibleTabs = computed<ViewTab[]>(() => {
  return tabOrder.filter(tab => {
    if (tab.key === 'profile') return true;
    if (tab.key === 'skills') return skills.value.length > 0;
    if (tab.key === 'equipment') return equipments.value.length > 0;
    if (tab.key === 'inventory') return hasInventory.value;
    if (tab.key === 'divinity') return hasDivinity.value;
    if (tab.key === 'backstory') return hasText(backstoryText.value);
    return false;
  });
});

watchEffect(() => {
  if (!visibleTabs.value.some(tab => tab.key === activeTab.value)) {
    activeTab.value = visibleTabs.value[0]?.key || 'profile';
  }
});

function detectIOSSafari(): boolean {
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  return isIOS && isSafari;
}

function setupParticleEngine() {
  if (!canvasRef.value || !bgLayerRef.value || !theme.value) return;
  engine?.destroy();
  engine = createParticleEngine({
    canvas: canvasRef.value,
    host: bgLayerRef.value,
    tier: theme.value.tier,
    colorHex: theme.value.tierHex,
    isIOSSafari: detectIOSSafari(),
  });
  engine.start();
}

function initFromYaml() {
  const yamlNode = document.getElementById('data-source');
  const yamlText = yamlNode?.textContent?.trim() || '';
  originalYamlText.value = yamlText;

  if (!yamlText) {
    parseError.value = { message: '未检测到 YAML 数据（#data-source 为空）。' };
    return;
  }

  const parsed = parseCharacterYaml(yamlText);
  if (!parsed.success) {
    parseError.value = parsed.error;
    return;
  }

  parseError.value = null;
  sheetData.value = parsed.data;
  theme.value = resolveTheme(parsed.data);
  applyTheme(theme.value);

  nextTick(() => setupParticleEngine());
}

function toggleImportMenu() {
  showImportMenu.value = !showImportMenu.value;
}

function closeImportMenu() {
  showImportMenu.value = false;
}

function flashImportButton(temp: string, duration = 1200) {
  const old = importButtonText.value;
  importButtonText.value = temp;
  setTimeout(() => {
    importButtonText.value = old;
  }, duration);
}

async function onImportMvu() {
  if (!sheetData.value || importing.value) return;
  importing.value = true;
  closeImportMenu();

  try {
    const ok = window.confirm(
      `确定要将角色 "${sheetData.value.姓名 || 'Unknown'}" 导入到 MVU 变量系统(命定系统.关系列表)吗？\n如果已存在同名角色，将会覆盖其数据。`,
    );
    if (!ok) return;

    importButtonText.value = '⏳';
    await importToMvuVariables(sheetData.value);
    flashImportButton('✅', 1600);
  } catch (err: any) {
    console.error('MVU Import Error:', err);
    flashImportButton('❌', 1800);
    window.alert(`导入失败: ${err?.message || String(err)}`);
  } finally {
    importing.value = false;
  }
}

async function onImportWorldbook() {
  if (!sheetData.value || importing.value) return;
  importing.value = true;
  closeImportMenu();

  try {
    importButtonText.value = '⏳';
    await saveToChatWorldbook(sheetData.value, originalYamlText.value);
    flashImportButton('✅', 1200);
  } catch (err: any) {
    console.error('Worldbook Save Error:', err);
    flashImportButton('❌', 1800);
    window.alert(`保存失败: ${err?.message || String(err)}`);
  } finally {
    importing.value = false;
  }
}

function onDocumentClick() {
  if (showImportMenu.value) closeImportMenu();
}

function onKeydown(ev: KeyboardEvent) {
  if (ev.key === 'Escape') closeImportMenu();
}

onMounted(() => {
  initFromYaml();
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  engine?.destroy();
  engine = null;
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
:root {
  --race-color: #ffffff;
  --race-color-rgb: 255, 255, 255;
  --tier-color: #808080;
  --tier-color-rgb: 128, 128, 128;
  --name-font-stack:
    'Noto Serif SC', 'Source Han Serif SC', 'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif;
  --name-shadow: rgba(0, 0, 0, 0.58);
  --name-glow: rgba(var(--tier-color-rgb), 0.12);
  --tier-label-fg: #f3f6ff;
}

.viewer-root {
  min-height: 100vh;
  padding: 24px 12px 48px;
  color: #f0f0f0;
  font-family: 'Noto Sans SC', sans-serif;
}

.loading-card,
.error-card {
  max-width: 720px;
  margin: 0 auto;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 16px;
}

.error-body {
  margin-top: 10px;
  font-size: 0.9rem;
}

.yaml-error-row {
  margin-bottom: 6px;
}

.yaml-error-title {
  font-weight: 700;
  margin-bottom: 6px;
}

.yaml-error-pre {
  margin: 0;
  padding: 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
  white-space: pre;
  overflow: auto;
}

.yaml-error-pre.alt {
  margin-top: 8px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.yaml-error-details {
  margin-top: 10px;
}

.yaml-error-details summary {
  cursor: pointer;
  user-select: none;
}

.card-wrapper {
  position: relative;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  border-radius: 16px;
  overflow: visible;
  z-index: 1;
}

.card-wrapper::before {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: 24px;
  pointer-events: none;
  z-index: -1;
  background:
    radial-gradient(
      120% 75% at 50% -5%,
      rgba(var(--tier-color-rgb), 0.34) 0%,
      rgba(var(--tier-color-rgb), 0.14) 38%,
      transparent 74%
    ),
    linear-gradient(
      180deg,
      rgba(var(--tier-color-rgb), 0.22) 0%,
      rgba(var(--tier-color-rgb), 0.06) 30%,
      transparent 62%
    );
  box-shadow:
    0 0 0 1px rgba(var(--tier-color-rgb), 0.2),
    0 0 24px rgba(var(--tier-color-rgb), 0.22);
  filter: blur(8px);
}

.frame-layer {
  position: absolute;
  top: -25px;
  left: -5px;
  width: calc(100% + 10px);
  height: calc(100% + 50px);
  z-index: 4;
  pointer-events: none;
  display: none;
  flex-direction: column;
}

.frame-layer.show {
  display: flex;
}

.frame-svg {
  width: 100%;
  fill: none;
  stroke: var(--tier-color);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 5px rgba(var(--tier-color-rgb), 0.8));
}

.frame-top {
  width: 100%;
  height: 100px;
  flex-shrink: 0;
}

.frame-body {
  width: 100%;
  flex-grow: 1;
}

.card-background-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(
    180deg,
    rgba(16, 21, 32, 0.9) 0%,
    rgba(13, 18, 29, 0.92) 56%,
    rgba(10, 14, 23, 0.94) 100%
  );
  border: 1px solid rgba(var(--tier-color-rgb), 0.72);
  border-top: 2px solid rgba(var(--tier-color-rgb), 1);
  box-shadow:
    0 14px 36px rgba(0, 0, 0, 0.78),
    0 0 28px rgba(var(--tier-color-rgb), 0.24),
    0 -2px 30px rgba(var(--tier-color-rgb), 0.42),
    inset 0 0 30px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(var(--tier-color-rgb), 0.75);
  backdrop-filter: blur(2px) saturate(136%);
  -webkit-backdrop-filter: blur(2px) saturate(136%);
}

.card-background-layer::before,
.card-background-layer::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.card-background-layer::before {
  z-index: 1;
  mix-blend-mode: screen;
  background-image:
    radial-gradient(
      140% 95% at 50% -8%,
      rgba(var(--tier-color-rgb), 0.66) 0%,
      rgba(var(--tier-color-rgb), 0.3) 32%,
      rgba(var(--tier-color-rgb), 0.08) 58%,
      transparent 78%
    ),
    linear-gradient(
      180deg,
      rgba(var(--tier-color-rgb), 0.48) 0%,
      rgba(var(--tier-color-rgb), 0.16) 26%,
      transparent 56%
    );
}

.card-background-layer::after {
  z-index: 1;
  opacity: 0.92;
  background-image:
    radial-gradient(circle at 50% 82%, rgba(var(--race-color-rgb), 0.26) 0%, transparent 74%),
    radial-gradient(circle at 50% 48%, transparent 58%, rgba(0, 0, 0, 0.33) 100%);
}

#particle-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
  mix-blend-mode: normal;
  opacity: 0.78;
}

.card-wrapper.high-tier .card-background-layer {
  border: 1px solid rgba(var(--tier-color-rgb), 0.95);
  border-top: 3px solid rgba(var(--tier-color-rgb), 1);
}

.sheet-content-wrapper {
  position: relative;
  z-index: 3;
}

.sheet-header {
  padding: 50px 20px 25px;
  text-align: center;
  position: relative;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(var(--tier-color-rgb), 0.2);
  background: radial-gradient(ellipse at 50% 0%, rgba(var(--tier-color-rgb), 0.15) 0%, transparent 80%);
}

.sheet-header::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background-image:
    linear-gradient(90deg, transparent 95%, rgba(var(--tier-color-rgb), 0.1) 95%),
    linear-gradient(0deg, transparent 95%, rgba(var(--tier-color-rgb), 0.1) 95%);
  background-size: 40px 40px;
  mask-image: linear-gradient(to bottom, rgba(148, 148, 148, 0.72) 0%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, rgba(148, 148, 148, 0.72) 0%, transparent 100%);
}

.level-badge {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 50px;
  border: 1px solid var(--tier-color);
  color: var(--tier-color);
  font-weight: 700;
  margin-bottom: 15px;
  background: rgba(0, 0, 0, 0.7);
  box-shadow: 0 0 15px rgba(var(--tier-color-rgb), 0.2);
  text-shadow: 0 0 8px rgba(var(--tier-color-rgb), 0.6);
}

.char-name {
  margin: 0 0 10px;
  font-size: 3rem;
  color: #ffffff;
  font-family: var(--name-font-stack);
  font-weight: 700;
  letter-spacing: 0.25px;
  line-height: 1.08;
  text-shadow:
    0 1px 2px var(--name-shadow),
    0 0 4px var(--name-glow);
}

.char-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  align-items: center;
  font-size: 0.95rem;
}

.meta-separator {
  color: rgba(242, 247, 255, 0.78);
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.86),
    0 0 3px rgba(var(--tier-color-rgb), 0.22);
}

.tier-name {
  display: inline-flex;
  align-items: center;
  padding: 1px 11px;
  border-radius: 999px;
  border: 1px solid rgba(var(--tier-color-rgb), 0.9);
  color: var(--tier-label-fg);
  background: linear-gradient(180deg, rgba(8, 10, 16, 0.84) 0%, rgba(10, 12, 18, 0.68) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 0 0 1px rgba(0, 0, 0, 0.52),
    0 0 10px rgba(var(--tier-color-rgb), 0.34);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
  font-weight: 700;
  letter-spacing: 0.12px;
  line-height: 1.2;
}

.sheet-body {
  padding: 20px 30px 90px;
}

.attributes-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-bottom: 30px;
  --flag-width: 96px;
  --flag-min-height: 118px;
  --flag-top-padding: 15px;
  --flag-bottom-padding: 30px;
  --flag-name-size: clamp(1rem, calc(var(--flag-width) * 0.2), 1.08rem);
  --flag-total-size: clamp(2rem, calc(var(--flag-width) * 0.4), 2.45rem);
  --flag-formula-size: clamp(0.76rem, calc(var(--flag-width) * 0.115), 0.86rem);
  --flag-total-offset: 0px;
}

.attribute-item {
  flex: 0 0 var(--flag-width);
  width: var(--flag-width);
  min-width: var(--flag-width);
  max-width: var(--flag-width);
  min-height: var(--flag-min-height);
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-top: 2px solid var(--race-color);
  clip-path: polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%);
  padding: var(--flag-top-padding) 5px var(--flag-bottom-padding);
  text-align: center;
  cursor: default;
  transition:
    transform 0.2s,
    background 0.2s,
    border-color 0.2s,
    box-shadow 0.2s;
}

.attribute-item.has-formula {
  cursor: pointer;
}

.attribute-item:hover {
  transform: translateY(-3px);
  background: rgba(var(--race-color-rgb), 0.1);
  box-shadow: 0 5px 20px rgba(var(--race-color-rgb), 0.15);
  border-color: rgba(var(--race-color-rgb), 0.4);
}

.attribute-name {
  display: block;
  font-size: var(--flag-name-size);
  color: #fff;
  margin-bottom: 6px;
  font-weight: 700;
  line-height: 1.05;
  opacity: 0.96;
}

.attribute-total {
  display: block;
  margin-top: var(--flag-total-offset, 0px);
  font-family: 'Cinzel', 'Times New Roman', serif;
  font-size: var(--flag-total-size);
  line-height: 1;
  font-weight: 700;
  text-shadow: 0 2px 15px rgba(var(--race-color-rgb), 0.45);
}

.attribute-formula {
  display: none;
  margin-top: 6px;
  font-size: var(--flag-formula-size);
  color: var(--race-color);
  font-weight: 700;
  line-height: 1.2;
}

.attribute-item.show-formula .attribute-total {
  display: none;
}

.attribute-item.show-formula .attribute-formula {
  display: block;
}

.tab-nav {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  margin-bottom: 14px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tab-nav::-webkit-scrollbar {
  display: none;
}

.tab-button {
  flex: 1;
  background: transparent;
  border: none;
  color: #9a9a9a;
  padding: 12px 16px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}

.tab-button.active {
  color: var(--race-color);
  border-bottom: 2px solid var(--race-color);
  font-weight: 700;
}
.tab-content {
  display: block;
}

.profile-grid {
  display: grid;
  gap: 8px;
}

.profile-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;
}

.profile-cell {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.profile-panel {
  height: 100%;
  box-sizing: border-box;
}

.subsection-title {
  font-size: 1.08rem;
  margin: 0 0 8px;
  padding-left: 8px;
  border-left: 3px solid var(--race-color);
  color: var(--race-color);
}

.divinity-main-title {
  text-align: center;
  border-left: none;
  color: var(--tier-color);
}

.story {
  white-space: pre-line;
  line-height: 1.58;
  margin-bottom: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 12px;
}

.tags-box {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 10px;
}

.card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 3px solid var(--race-color);
  padding: 12px;
  margin-bottom: 12px;
  border-radius: 6px;
}

.divinity-card {
  border-left-color: var(--tier-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.card-title {
  margin: 0;
  font-size: 1.05rem;
  color: #fff;
  font-weight: 700;
}

.card-subtitle {
  font-size: 0.85rem;
  color: #bbb;
}

.card-title.quality-common,
.card-subtitle.quality-common {
  color: #c4cad3;
}

.card-title.quality-uncommon,
.card-subtitle.quality-uncommon {
  color: #7be495;
  text-shadow: 0 0 10px rgba(123, 228, 149, 0.28);
}

.card-title.quality-rare,
.card-subtitle.quality-rare {
  color: #62bbff;
  text-shadow: 0 0 10px rgba(98, 187, 255, 0.3);
}

.card-title.quality-epic,
.card-subtitle.quality-epic {
  color: #cf95ff;
  text-shadow: 0 0 10px rgba(207, 149, 255, 0.3);
}

.card-title.quality-legendary,
.card-subtitle.quality-legendary {
  color: #ffc46b;
  text-shadow: 0 0 10px rgba(255, 196, 107, 0.3);
}

.card-title.quality-mythic,
.card-subtitle.quality-mythic {
  color: #ff78c5;
  text-shadow: 0 0 10px rgba(255, 120, 197, 0.3);
}

.card-body p {
  margin: 5px 0;
  white-space: pre-line;
  line-height: 1.5;
}

.card-label {
  color: var(--race-color);
  font-weight: 700;
  margin-right: 4px;
}

.effect-list {
  margin: 4px 0 8px;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.effect-item {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

.effect-name {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(var(--race-color-rgb), 0.5);
  background: rgba(var(--race-color-rgb), 0.12);
  color: var(--race-color);
  font-weight: 700;
  font-size: 0.78rem;
  line-height: 1;
  padding: 3px 8px;
}

.effect-text {
  flex: 1;
  min-width: 0;
  white-space: pre-line;
  line-height: 1.45;
}

.card-description {
  margin-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: 8px;
  opacity: 0.9;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.card-tag {
  display: inline-block;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.82rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
}

#import-action-btn {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 30, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  z-index: 60;
  font-size: 1.2rem;
  transition: all 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
}

#import-action-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

#import-action-btn:hover:not(:disabled) {
  background: rgba(60, 60, 60, 0.92);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
  border-color: #fff;
}

#import-action-menu {
  position: absolute;
  bottom: 55px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 20, 20, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  padding: 6px;
  z-index: 70;
  min-width: 190px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: none;
}

#import-action-menu.show {
  display: block;
}

#import-action-menu button {
  width: 100%;
  background: transparent;
  border: 1px solid transparent;
  color: #eee;
  padding: 10px 10px;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  font-size: 0.95rem;
}

#import-action-menu button:disabled {
  opacity: 0.6;
  cursor: wait;
}

#import-action-menu button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
}

@media (min-width: 900px) {
  .attributes-grid {
    justify-content: center;
    gap: 12px;
    --flag-width: 140px;
    --flag-min-height: 150px;
    --flag-top-padding: 20px;
    --flag-bottom-padding: 38px;
    --flag-total-offset: 10px;
  }
}

@media (max-width: 820px) {
  .viewer-root {
    padding: 18px 10px 36px;
  }

  .sheet-body {
    padding: 16px 18px 84px;
  }

  .sheet-header {
    padding: 40px 16px 20px;
  }

  .char-name {
    font-size: 2.2rem;
    letter-spacing: 0.2px;
    text-shadow:
      0 1px 2px var(--name-shadow),
      0 0 3px rgba(var(--tier-color-rgb), 0.12);
  }

  .tab-button {
    flex: 0 0 auto;
    min-width: 82px;
    padding: 10px 12px;
  }
}

@media (max-width: 640px) {
  .card-wrapper {
    max-width: 100%;
    border-radius: 14px;
  }

  .card-background-layer {
    border-radius: 14px;
  }

  .sheet-header {
    padding: 34px 12px 16px;
    margin-bottom: 6px;
  }

  .level-badge {
    margin-bottom: 10px;
    padding: 3px 12px;
    font-size: 0.9rem;
  }

  .char-name {
    font-size: 1.8rem;
    margin-bottom: 8px;
    letter-spacing: 0.1px;
    text-shadow:
      0 1px 2px var(--name-shadow),
      0 0 2px rgba(var(--tier-color-rgb), 0.1);
  }

  .char-meta-row {
    gap: 6px;
    font-size: 0.82rem;
  }

  .tier-name {
    padding: 1px 8px;
    border-width: 1px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      0 0 5px rgba(var(--tier-color-rgb), 0.16);
  }

  .sheet-body {
    padding: 12px 10px 80px;
  }

  .attributes-grid {
    gap: 8px 10px;
    margin-bottom: 16px;
    --flag-width: calc((100% - 20px) / 3);
    --flag-min-height: calc(var(--flag-width) * 1.18);
    --flag-top-padding: 12px;
    --flag-bottom-padding: 26px;
    --flag-name-size: clamp(0.98rem, calc(var(--flag-width) * 0.16), 1.08rem);
    --flag-total-size: clamp(2.05rem, calc(var(--flag-width) * 0.34), 2.45rem);
    --flag-formula-size: clamp(0.72rem, calc(var(--flag-width) * 0.105), 0.82rem);
  }

  .attribute-item {
    flex: 0 0 var(--flag-width);
    width: var(--flag-width);
    max-width: var(--flag-width);
    min-width: 0;
    min-height: var(--flag-min-height);
    padding: var(--flag-top-padding) 5px var(--flag-bottom-padding);
  }

  .profile-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .subsection-title {
    font-size: 1rem;
  }
  .story,
  .card,
  .tags-box {
    padding: 10px;
  }

  #import-action-btn {
    bottom: 10px;
    font-size: 1.05rem;
    padding: 7px 10px;
  }

  #import-action-menu {
    bottom: 46px;
    min-width: 170px;
  }

  #import-action-menu button {
    padding: 8px;
    font-size: 0.9rem;
  }
}
</style>
