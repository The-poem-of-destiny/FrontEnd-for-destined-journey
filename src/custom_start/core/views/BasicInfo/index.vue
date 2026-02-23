<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
  FormCascader,
  FormInput,
  FormLabel,
  FormNumber,
  FormSelect,
  FormStepper,
  FormTextarea,
} from '../../components/Form';
import {
  ATTRIBUTES,
  getGenders,
  getIdentityCosts,
  getLevelTierName,
  getRaceCosts,
  getStartLocationsCascader,
  getTierAttributeBonus,
  MAX_BASE_POINTS_PER_ATTR,
  MAX_LEVEL,
  MIN_LEVEL,
} from '../../data/base-info';
import { useCharacterStore } from '../../store';

const characterStore = useCharacterStore();
const { character } = storeToRefs(characterStore);
const { addBasePoint, removeBasePoint, addAttributePoint, removeAttributePoint } = characterStore;

// 从外部数据获取选项列表
const genders = getGenders;
const raceCosts = getRaceCosts;
const identityCosts = getIdentityCosts;
const startLocationsCascader = getStartLocationsCascader;

const raceOptions = computed(() => Object.keys(raceCosts.value));
const identityOptions = computed(() => Object.keys(identityCosts.value));

// 计算当前等级的层级属性加成
const tierAttributeBonus = computed(() => getTierAttributeBonus(character.value.level));

// 计算剩余可用转生点数
const availableReincarnationPoints = computed(() => {
  return character.value.reincarnationPoints - characterStore.consumedPoints;
});

// 计算当前等级对应的层级
const levelTierName = computed(() => {
  const level = character.value.level;
  const tierName = getLevelTierName(level);

  return tierName;
});
</script>

<template>
  <div class="basic-info">
    <div class="form-container">
      <!-- 第一行：姓名和性别 -->
      <div class="form-row">
        <div class="form-field">
          <FormLabel label="姓名" required />
          <FormInput v-model="character.name" placeholder="请输入角色姓名" />
        </div>
        <div class="form-field">
          <FormLabel label="性别" required />
          <FormSelect v-model="character.gender" :options="genders" />
          <FormTextarea
            v-if="character.gender === '自定义'"
            v-model="character.customGender"
            :rows="2"
            placeholder="请输入自定义性别"
          />
        </div>
      </div>

      <!-- 第二行：年龄和等级 -->
      <div class="form-row">
        <div class="form-field">
          <FormLabel label="年龄" />
          <FormNumber v-model="character.age" :min="1" :max="10000" />
        </div>
        <div class="form-field">
          <FormLabel label="等级" required />
          <div class="level-input-group">
            <FormNumber v-model="character.level" :min="MIN_LEVEL" :max="MAX_LEVEL" />
            <span class="level-indicator">{{ levelTierName }}</span>
          </div>
        </div>
      </div>

      <!-- 第三行：种族和身份 -->
      <div class="form-row">
        <div class="form-field">
          <FormLabel label="种族" required />
          <FormSelect
            v-model="character.race"
            searchable
            search-placeholder="搜索种族..."
            :options="
              raceOptions.map(race => ({
                label:
                  race +
                  (raceCosts[race] !== 0
                    ? ` (${raceCosts[race] > 0 ? '-' : '+'}${Math.abs(raceCosts[race])}点)`
                    : ''),
                value: race,
              }))
            "
          />
          <FormTextarea
            v-if="character.race === '自定义'"
            v-model="character.customRace"
            :rows="2"
            placeholder="请输入自定义种族"
          />
        </div>
        <div class="form-field">
          <FormLabel label="身份" required />
          <FormSelect
            v-model="character.identity"
            searchable
            search-placeholder="搜索身份..."
            :options="
              identityOptions.map(identity => ({
                label:
                  identity +
                  (identityCosts[identity] !== 0
                    ? ` (${identityCosts[identity] > 0 ? '-' : '+'}${Math.abs(identityCosts[identity])}点)`
                    : ''),
                value: identity,
              }))
            "
          />
          <FormTextarea
            v-if="character.identity === '自定义'"
            v-model="character.customIdentity"
            :rows="2"
            placeholder="请输入自定义身份"
          />
        </div>
      </div>

      <!-- 第四行：起始地点（使用级联选择器） -->
      <div class="form-row full-width">
        <div class="form-field">
          <FormLabel label="起始地点" required />
          <FormCascader
            v-model="character.startLocation"
            :options="startLocationsCascader"
            placeholder="请选择起始地点"
            search-placeholder="搜索地点..."
          />
          <FormTextarea
            v-if="character.startLocation === '自定义'"
            v-model="character.customStartLocation"
            :rows="2"
            placeholder="请输入自定义起始地点"
          />
        </div>
      </div>

      <!-- 属性分配面板 -->
      <div class="attributes-panel">
        <div class="panel-header">
          <h3>属性分配</h3>
          <div class="points-summary">
            <span class="points-badge">
              基础点:
              <strong
                :class="{
                  error: characterStore.remainingBP < 0,
                  success: characterStore.remainingBP === 0,
                }"
                >{{ characterStore.remainingBP }}</strong
              >
              / {{ characterStore.maxBP }}
              <span class="points-hint">（单项≤{{ MAX_BASE_POINTS_PER_ATTR }}）</span>
            </span>
            <span v-if="characterStore.maxAP > 0" class="points-badge">
              额外点:
              <strong
                :class="{
                  error: characterStore.remainingAP < 0,
                  success: characterStore.remainingAP === 0,
                }"
                >{{ characterStore.remainingAP }}</strong
              >
              / {{ characterStore.maxAP }}
            </span>
          </div>
        </div>

        <div class="panel-content">
          <!-- 表头 -->
          <div class="attr-table-header">
            <span class="col-name">属性</span>
            <span class="col-base">基础点</span>
            <span class="col-tier">层级</span>
            <span v-if="characterStore.maxAP > 0" class="col-extra">额外点</span>
            <span class="col-result">总属性</span>
          </div>

          <!-- 每个属性一行 -->
          <div v-for="attr in ATTRIBUTES" :key="attr" class="attr-row">
            <span class="col-name">{{ attr }}</span>

            <!-- 基础点 stepper -->
            <div class="col-base">
              <span class="mobile-label">基础点</span>
              <FormStepper
                :model-value="character.basePoints[attr]"
                :min="0"
                :max="MAX_BASE_POINTS_PER_ATTR"
                :disable-increment="
                  characterStore.remainingBP <= 0 ||
                  character.basePoints[attr] >= MAX_BASE_POINTS_PER_ATTR
                "
                @increment="addBasePoint(attr)"
                @decrement="removeBasePoint(attr)"
              />
            </div>

            <!-- 层级固定值 -->
            <div class="col-tier">
              <span class="mobile-label">层级</span>
              <span class="tier-value">{{ tierAttributeBonus }}</span>
            </div>

            <!-- 额外点 stepper -->
            <div v-if="characterStore.maxAP > 0" class="col-extra">
              <span class="mobile-label">额外点</span>
              <FormStepper
                :model-value="character.attributePoints[attr]"
                :min="0"
                :max="characterStore.maxAP"
                :disable-increment="characterStore.remainingAP <= 0"
                @increment="addAttributePoint(attr)"
                @decrement="removeAttributePoint(attr)"
              />
            </div>

            <!-- 最终值 -->
            <div class="col-result">
              <span class="mobile-label">总属性</span>
              <span class="final-value">{{ characterStore.finalAttributes[attr] }}</span>
            </div>
          </div>

          <!-- 状态提示 -->
          <div v-if="availableReincarnationPoints < 0" class="status-message error">
            ⚠️ 转生点数不足！
          </div>
          <div
            v-else-if="characterStore.remainingBP === 0 && characterStore.remainingAP === 0"
            class="status-message success"
          >
            ✓ 属性点已全部分配
          </div>
          <div
            v-else-if="characterStore.remainingBP > 0 || characterStore.remainingAP > 0"
            class="status-message info"
          >
            <span v-if="characterStore.remainingBP > 0"
              >基础点剩余 {{ characterStore.remainingBP }}</span
            >
            <span
              v-if="characterStore.remainingBP > 0 && characterStore.remainingAP > 0"
              class="sep"
              >｜</span
            >
            <span v-if="characterStore.remainingAP > 0"
              >额外点剩余 {{ characterStore.remainingAP }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);

  &.full-width {
    grid-template-columns: 1fr;
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);

  label {
    font-weight: 600;
    color: var(--accent-color);
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    letter-spacing: 0.5px;

    &.required::after {
      content: '*';
      color: #ff6b6b;
      font-weight: bold;
      margin-left: 2px;
    }
  }
}

.level-input-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);

  .number-input-wrapper {
    flex: 1;
  }

  .level-indicator {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    color: var(--accent-color);
    font-weight: 600;
    font-size: 0.9rem;
    white-space: nowrap;
  }
}

.attributes-panel {
  margin: var(--spacing-2xl) 0 0;

  .panel-header {
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-sm);

    h3 {
      margin: 0;
      color: var(--title-color);
      font-size: 1.2rem;
      font-weight: 700;
    }

    .points-summary {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex-wrap: wrap;
    }

    .points-badge {
      font-size: 0.9rem;
      color: var(--text-color);
      padding: var(--spacing-xs) var(--spacing-sm);
      background: var(--primary-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);

      strong {
        color: var(--accent-color);
        font-size: 1.1rem;

        &.error {
          color: var(--error-color);
        }

        &.success {
          color: var(--success-color);
        }
      }

      .points-hint {
        font-size: 0.75rem;
        opacity: 0.7;
      }
    }
  }

  .panel-content {
    padding: var(--spacing-lg);
  }

  // 移动端标签（桌面端隐藏）
  .mobile-label {
    display: none;
  }

  .attr-table-header {
    display: grid;
    grid-template-columns: 50px auto 40px auto 50px;
    gap: var(--spacing-md);
    align-items: center;
    padding: var(--spacing-xs) var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-color-secondary);
    border-bottom: 1px solid var(--border-color);
    text-align: center;

    .col-name {
      text-align: left;
    }

    .col-result {
      text-align: right;
    }
  }

  .attr-row {
    display: grid;
    grid-template-columns: 50px auto 40px auto 50px;
    gap: var(--spacing-md);
    align-items: center;
    padding: var(--spacing-sm);
    border-bottom: 1px solid var(--border-color-light, rgba(255, 255, 255, 0.05));
    transition: background var(--transition-fast);

    &:hover {
      background: var(--primary-bg);
    }

    &:last-of-type {
      border-bottom: none;
    }

    .col-name {
      font-weight: 600;
      color: var(--title-color);
      font-size: 1rem;
    }

    .col-base,
    .col-extra {
      display: flex;
      justify-content: center;
    }

    .col-tier {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .tier-value {
      font-weight: 600;
      color: var(--text-color-secondary);
      font-size: 1rem;
    }

    .col-result {
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }

    .final-value {
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--accent-color);
    }

    // 去掉 stepper 自带的 label（本行已有属性名列）
    :deep(.form-stepper) {
      .stepper-label {
        display: none;
      }
    }
  }

  // 无额外点时的列布局（4列）
  .attr-table-header:not(:has(+ .attr-row .col-extra)),
  .attr-row:not(:has(.col-extra)) {
    grid-template-columns: 50px auto 40px 50px;
  }

  .status-message {
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    text-align: center;
    font-weight: 600;
    font-size: 1rem;
    border: 1px solid;
    margin-top: var(--spacing-md);

    .sep {
      margin: 0 var(--spacing-xs);
      opacity: 0.5;
    }

    &.error {
      background: rgba(211, 47, 47, 0.1);
      color: var(--error-color);
      border-color: var(--error-color);
    }

    &.success {
      background: rgba(56, 142, 60, 0.1);
      color: var(--success-color);
      border-color: var(--success-color);
    }

    &.info {
      background: rgba(212, 175, 55, 0.1);
      color: var(--accent-color);
      border-color: var(--accent-color);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;

    &.full-width {
      grid-template-columns: 1fr;
    }
  }

  .level-input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .location-field {
    .location-options {
      max-height: 300px;
    }

    .location-option {
      .location-label {
        font-size: 0.85rem;
      }
    }
  }

  .attributes-panel {
    .panel-header {
      flex-direction: column;
      align-items: stretch;
    }

    .attr-table-header {
      display: none;
    }

    .mobile-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-color-secondary);
      margin-bottom: var(--spacing-xs);
    }

    .attr-row {
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-sm);
      padding: var(--spacing-md) var(--spacing-sm);

      .col-name {
        grid-column: 1 / -1;
        font-size: 1.1rem;
        padding-bottom: var(--spacing-xs);
        border-bottom: 1px solid var(--border-color-light, rgba(255, 255, 255, 0.05));
      }

      .col-base,
      .col-extra,
      .col-tier,
      .col-result {
        flex-direction: column;
        align-items: flex-start;
      }

      .col-result {
        align-items: flex-end;
      }
    }

    // 无额外点时移动端改为3列（基础点、层级、总属性）
    .attr-row:not(:has(.col-extra)) {
      grid-template-columns: 1fr auto 1fr;

      .col-result {
        align-items: flex-end;
      }
    }
  }
}
</style>
