<script setup lang="ts">
import { parseMacroDeep, useExpandableCards, useSelectableList } from '../../../composables';
import { useCharacterStore } from '../../../store/character';
import type { DestinedOne } from '../../../types';

interface Props {
  items: DestinedOne[];
}

interface Emits {
  (e: 'select', item: DestinedOne): void;
  (e: 'deselect', item: DestinedOne): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const characterStore = useCharacterStore();

const availablePoints = computed(() => {
  return characterStore.character.reincarnationPoints - characterStore.consumedPoints;
});

// 使用通用可选列表逻辑
const { isSelected, canSelect } = useSelectableList(
  () => characterStore.selectedDestinedOnes,
  () => availablePoints.value,
);

// 使用通用折叠状态管理
const { toggleExpand, isExpanded } = useExpandableCards();

// 处理选择
const handleToggle = (item: DestinedOne) => {
  if (isSelected(item)) {
    emit('deselect', item);
  } else if (canSelect(item)) {
    emit('select', item);
  }
};

// 解析后的命定之人数据
const parsedItems = ref<DestinedOne[]>([]);

// 解析所有命定之人
watch(
  () => props.items,
  async items => {
    parsedItems.value = await Promise.all(items.map(parseMacroDeep));
  },
  { immediate: true },
);
</script>

<template>
  <div class="destined-one-list">
    <div v-if="parsedItems.length === 0" class="empty-message">该分类暂无命定之人</div>
    <div
      v-for="item in parsedItems"
      :key="item.name"
      class="destined-one-card"
      :class="{
        selected: isSelected(item),
        disabled: !isSelected(item) && !canSelect(item),
        expanded: isExpanded(item.name),
      }"
      @click="handleToggle(item)"
    >
      <div class="card-header">
        <h3 class="item-name">{{ item.name }}</h3>
        <div class="header-actions">
          <div class="item-cost">{{ item.cost }} 点</div>
          <button class="expand-btn" @click="toggleExpand(item.name, $event)">
            {{ isExpanded(item.name) ? '收起' : '展开' }}
          </button>
        </div>
      </div>

      <!-- 基本信息（始终显示） -->
      <div class="card-summary">
        <div class="summary-row">
          <span class="label">层级：</span>
          <span class="value">{{ item.lifeLevel }}</span>
        </div>
        <div class="summary-row">
          <span class="label">种族：</span>
          <span class="value">{{ item.race }}</span>
        </div>
        <div class="summary-row">
          <span class="label">等级：</span>
          <span class="value">Lv.{{ item.level }}</span>
        </div>
        <div class="summary-row">
          <span class="label">好感度：</span>
          <span class="value">{{ item.affinity }}</span>
        </div>
      </div>

      <!-- 详细信息（可折叠） -->
      <div v-if="isExpanded(item.name)" class="card-body">
        <div class="info-section">
          <div class="info-row">
            <span class="label">身份：</span>
            <span class="value">{{ item.identity.join('、') }}</span>
          </div>
          <div class="info-row">
            <span class="label">职业：</span>
            <span class="value">{{ item.career.join('、') }}</span>
          </div>
          <div class="info-row">
            <span class="label">性格：</span>
            <span class="value">{{ item.personality }}</span>
          </div>
          <div class="info-row">
            <span class="label">是否缔结契约：</span>
            <span class="value">{{ item.isContract ? '是' : '否' }}</span>
          </div>
        </div>

        <div class="info-section">
          <div class="info-block">
            <div class="block-title">喜好</div>
            <div class="block-content">{{ item.like }}</div>
          </div>
          <div class="info-block">
            <div class="block-title">外貌</div>
            <div class="block-content">{{ item.app }}</div>
          </div>
          <div class="info-block">
            <div class="block-title">服饰</div>
            <div class="block-content">{{ item.cloth }}</div>
          </div>
        </div>

        <div class="info-section">
          <div class="block-title">属性</div>
          <div class="attributes">
            <div class="attr-item">
              <span class="attr-label">力量：</span>
              <span class="attr-value">{{ item.attributes.strength }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">敏捷：</span>
              <span class="attr-value">{{ item.attributes.dexterity }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">体质：</span>
              <span class="attr-value">{{ item.attributes.constitution }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">智力：</span>
              <span class="attr-value">{{ item.attributes.intelligence }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">精神：</span>
              <span class="attr-value">{{ item.attributes.mind }}</span>
            </div>
          </div>
        </div>

        <div v-if="item.equip && item.equip.length > 0" class="info-section">
          <div class="block-title">装备</div>
          <div class="equipment-list">
            <div v-for="(equip, index) in item.equip" :key="index" class="equipment-item">
              <div class="equip-name">{{ equip.name }}</div>
              <div v-if="equip.type" class="equip-info">类型：{{ equip.type }}</div>
              <div v-if="equip.tag && equip.tag.length > 0" class="equip-info">
                标签：{{ equip.tag.join('、') }}
              </div>
              <div v-if="Object.keys(equip.effect || {}).length > 0" class="equip-info">
                效果：
                <span v-for="(value, key) in equip.effect" :key="key" class="effect-inline">
                  {{ key }}：{{ value }}
                </span>
              </div>
              <div v-else class="equip-info">效果：无</div>
              <div v-if="equip.description" class="equip-desc">{{ equip.description }}</div>
            </div>
          </div>
        </div>

        <div v-if="item.skills && item.skills.length > 0" class="info-section">
          <div class="block-title">技能</div>
          <div class="skills-list">
            <div v-for="(skill, index) in item.skills" :key="index" class="skill-item">
              <div class="skill-header">
                <span class="skill-name">{{ skill.name }}</span>
                <span class="skill-type">{{ skill.type }}</span>
              </div>
              <div v-if="skill.tag && skill.tag.length > 0" class="skill-tag">
                {{ skill.tag.join('、') }}
              </div>
              <div v-if="skill.consume" class="skill-consume">消耗：{{ skill.consume }}</div>
              <div v-if="Object.keys(skill.effect || {}).length > 0" class="skill-effect">
                <span v-for="(value, key) in skill.effect" :key="key" class="effect-inline">
                  {{ key }}：{{ value }}
                </span>
              </div>
              <div v-else class="skill-effect">无效果</div>
              <div class="skill-desc">{{ skill.description }}</div>
            </div>
          </div>
        </div>

        <div v-if="item.stairway.isOpen" class="info-section">
          <div class="block-title">登神长阶</div>
          <div class="stairway-content">
            <div v-if="item.stairway.elements" class="stairway-section">
              <div class="stairway-label">元素：</div>
              <div v-for="(value, key) in item.stairway.elements" :key="key" class="stairway-item">
                {{ key }}：{{ value }}
              </div>
            </div>
            <div v-if="item.stairway.powers" class="stairway-section">
              <div class="stairway-label">权能：</div>
              <div v-for="(value, key) in item.stairway.powers" :key="key" class="stairway-item">
                {{ key }}：{{ value }}
              </div>
            </div>
            <div v-if="item.stairway.laws" class="stairway-section">
              <div class="stairway-label">法则：</div>
              <div v-for="(value, key) in item.stairway.laws" :key="key" class="stairway-item">
                {{ key }}：{{ value }}
              </div>
            </div>
            <div v-if="item.stairway.godlyRank" class="stairway-item">
              神位：{{ item.stairway.godlyRank }}
            </div>
            <div v-if="item.stairway.godKingdom" class="stairway-section">
              <div class="stairway-label">神国：</div>
              <div class="stairway-item">{{ item.stairway.godKingdom.name }}</div>
              <div class="stairway-desc">{{ item.stairway.godKingdom.description }}</div>
            </div>
          </div>
        </div>

        <div v-if="item.backgroundInfo" class="info-section">
          <div class="info-block">
            <div class="block-title">背景故事</div>
            <div class="block-content">{{ item.backgroundInfo }}</div>
          </div>
        </div>

        <div v-if="item.comment" class="comment">"{{ item.comment }}"</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.destined-one-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
}

.empty-message {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-light);
  font-size: 1.1rem;
}

.destined-one-card {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--accent-color);
  }

  &.selected {
    border-color: var(--accent-color);
    background: rgba(212, 175, 55, 0.15);
    box-shadow: var(--shadow-md);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.expanded {
    .card-body {
      max-height: 10000px;
      opacity: 1;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--border-color);

  .item-name {
    font-size: 1.2rem;
    color: var(--title-color);
    margin: 0;
    flex: 1;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .item-cost {
    font-weight: 600;
    color: var(--accent-color);
    font-size: 1rem;
  }

  .expand-btn {
    padding: 2px var(--spacing-sm);
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 0.8rem;
    color: var(--text-color);
    transition: all var(--transition-fast);

    &:hover {
      background: var(--accent-color);
      color: var(--primary-bg);
      border-color: var(--accent-color);
    }
  }
}

.card-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);

  .summary-row {
    display: flex;
    gap: var(--spacing-xs);
    font-size: 0.85rem;

    .label {
      color: var(--text-light);
      white-space: nowrap;
    }

    .value {
      color: var(--text-color);
      font-weight: 500;
    }
  }
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: all var(--transition-normal);
}

.info-section {
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-color-light);

  &:last-child {
    border-bottom: none;
  }
}

.info-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--spacing-sm);
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: var(--spacing-xs);

  .label {
    color: var(--text-light);
    font-weight: 500;
    white-space: nowrap;
  }

  .value {
    color: var(--text-color);
    word-break: break-word;
  }
}

.info-block {
  margin-bottom: var(--spacing-sm);

  &:last-child {
    margin-bottom: 0;
  }
}

.block-title {
  font-weight: 600;
  color: var(--title-color);
  margin-bottom: var(--spacing-xs);
  font-size: 0.95rem;
}

.block-content {
  color: var(--text-color);
  line-height: 1.6;
  font-size: 0.85rem;
}

.attributes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: var(--spacing-xs);
}

.attr-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 4px var(--spacing-xs);
  background: rgba(212, 175, 55, 0.05);
  border-radius: var(--radius-sm);

  .attr-label {
    color: var(--text-light);
    font-size: 0.8rem;
  }

  .attr-value {
    color: var(--accent-color);
    font-weight: 600;
    font-size: 0.85rem;
  }
}

.equipment-list,
.skills-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.equipment-item,
.skill-item {
  padding: var(--spacing-sm);
  background: rgba(0, 0, 0, 0.02);
  border-left: 3px solid var(--accent-color);
  border-radius: var(--radius-sm);
}

.equip-name,
.skill-name {
  font-weight: 600;
  color: var(--title-color);
  margin-bottom: var(--spacing-xs);
  font-size: 0.9rem;
}

.equip-info,
.skill-tag,
.skill-consume {
  font-size: 0.8rem;
  color: var(--text-light);
  margin-bottom: var(--spacing-xs);
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.effect-inline {
  padding: 2px 6px;
  background: rgba(212, 175, 55, 0.12);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  color: var(--text-color);
}

.equip-desc,
.skill-effect,
.skill-desc {
  font-size: 0.8rem;
  color: var(--text-color);
  line-height: 1.5;
  margin-bottom: var(--spacing-xs);

  &:last-child {
    margin-bottom: 0;
  }
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);

  .skill-type {
    font-size: 0.75rem;
    padding: 2px var(--spacing-xs);
    background: var(--accent-color);
    color: var(--primary-bg);
    border-radius: var(--radius-sm);
  }
}

.stairway-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.stairway-section {
  padding: var(--spacing-xs);
  background: rgba(0, 0, 0, 0.02);
  border-radius: var(--radius-sm);
}

.stairway-label {
  font-weight: 600;
  color: var(--title-color);
  margin-bottom: var(--spacing-xs);
  font-size: 0.85rem;
}

.stairway-item {
  font-size: 0.8rem;
  color: var(--text-color);
  margin-bottom: var(--spacing-xs);
  line-height: 1.5;

  &:last-child {
    margin-bottom: 0;
  }
}

.stairway-desc {
  font-size: 0.8rem;
  color: var(--text-light);
  line-height: 1.5;
  margin-top: var(--spacing-xs);
}

.comment {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: rgba(212, 175, 55, 0.1);
  border-left: 3px solid var(--accent-color);
  border-radius: var(--radius-sm);
  font-style: italic;
  color: var(--text-color);
  font-size: 0.85rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .destined-one-list {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
    padding: var(--spacing-sm);
  }

  .destined-one-card {
    padding: var(--spacing-sm);
  }

  .card-header {
    flex-wrap: wrap;
    gap: var(--spacing-xs);

    .item-name {
      font-size: 1.1rem;
      flex-basis: 100%;
    }

    .header-actions {
      flex-basis: 100%;
      justify-content: space-between;
    }

    .item-cost {
      font-size: 0.9rem;
    }
  }

  .card-summary {
    grid-template-columns: 1fr;
  }

  .attributes {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
