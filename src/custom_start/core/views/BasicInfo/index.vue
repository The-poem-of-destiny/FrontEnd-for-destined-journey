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
const hasAttributePoints = computed(() => characterStore.maxAP > 0);

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
      <div class="attributes-panel" :class="{ 'has-extra-points': hasAttributePoints }">
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
            <span v-if="hasAttributePoints" class="points-badge">
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
            <span v-if="hasAttributePoints" class="col-extra">额外点</span>
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
            <div v-if="hasAttributePoints" class="col-extra">
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
  --attr-grid-columns: 50px auto 40px 50px;

  margin: var(--spacing-lg) 0 0;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--card-bg);
  overflow: hidden;

  &.has-extra-points {
    --attr-grid-columns: 50px auto 40px auto 50px;
  }

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
    grid-template-columns: var(--attr-grid-columns);
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
    grid-template-columns: var(--attr-grid-columns);
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
      background: rgba(46, 125, 50, 0.1);
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
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);

    &.full-width {
      grid-template-columns: 1fr;
    }
  }

  .level-input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .attributes-panel {
    --attr-grid-columns: 34px minmax(92px, 1fr) 30px 38px;

    margin-top: var(--spacing-md);

    &.has-extra-points {
      --attr-grid-columns: 34px minmax(88px, 1fr) 30px minmax(88px, 1fr) 38px;
    }

    .panel-header {
      align-items: center;
      padding: var(--spacing-xs) var(--spacing-sm);
      gap: var(--spacing-xs);

      h3 {
        font-size: 1rem;
      }

      .points-summary {
        gap: var(--spacing-xs);
      }

      .points-badge {
        padding: 2px 6px;
        font-size: 0.78rem;

        strong {
          font-size: 0.95rem;
        }

        .points-hint {
          display: none;
        }
      }
    }

    .panel-content {
      padding: var(--spacing-sm);
    }

    .attr-table-header {
      display: grid;
      grid-template-columns: var(--attr-grid-columns);
      gap: 6px;
      padding: 2px 4px 4px;
      font-size: 0.68rem;
    }

    .mobile-label {
      display: none;
    }

    .attr-row {
      grid-template-columns: var(--attr-grid-columns);
      gap: 6px;
      padding: 4px;

      .col-name {
        grid-column: auto;
        font-size: 0.86rem;
        padding-bottom: 0;
        border-bottom: none;
      }

      .col-base,
      .col-extra,
      .col-tier,
      .col-result {
        align-items: center;
        justify-content: center;
      }

      .col-result {
        justify-content: flex-end;
      }

      :deep(.stepper-controls) {
        gap: 2px;
        padding: 1px;
      }

      :deep(.stepper-btn) {
        width: 24px;
        height: 24px;
        font-size: 0.95rem;
      }

      :deep(.stepper-value) {
        min-width: 22px;
        font-size: 0.88rem;
      }

      .tier-value,
      .final-value {
        font-size: 0.9rem;
      }
    }

    .status-message {
      margin-top: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
      font-size: 0.82rem;
    }
  }
}

@media (max-width: 480px) {
  .attributes-panel {
    --attr-grid-columns: 30px minmax(86px, 1fr) 28px 34px;

    &.has-extra-points {
      --attr-grid-columns: 30px minmax(78px, 1fr) 26px minmax(78px, 1fr) 32px;
    }

    .panel-content {
      padding: 6px;
    }

    .points-summary {
      gap: var(--spacing-xs);
    }

    .points-badge {
      font-size: 0.8rem;
    }

    .attr-row {
      grid-template-columns: var(--attr-grid-columns);
      gap: 4px;

      .col-base,
      .col-extra,
      .col-tier,
      .col-result {
        align-items: center;
      }

      .col-result {
        justify-content: flex-end;
      }
    }

    .attr-table-header {
      grid-template-columns: var(--attr-grid-columns);
      gap: 4px;
    }
  }
}
</style>
