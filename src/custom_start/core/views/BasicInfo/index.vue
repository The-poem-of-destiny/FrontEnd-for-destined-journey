<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, inject, type Ref, watch } from 'vue';
import { FormInput, FormLabel, FormNumber, FormSelect, FormStepper, FormTextarea } from '../../components/Form';
import {
  ATTRIBUTES,
  BASE_STAT,
  getGenders,
  getIdentityCosts,
  getLevelTierName,
  getRaceCosts,
  getStartLocations,
  getTierAttributeBonus,
  MAX_LEVEL,
  MIN_LEVEL,
  raceAttrs,
} from '../../data/base-info';
import { useCharacterStore } from '../../store';

const characterStore = useCharacterStore();
const { character } = storeToRefs(characterStore);
const { addAttributePoint, removeAttributePoint } = characterStore;

// 注入父组件提供的触发器
const randomGenerateTrigger = inject<Ref<number>>('randomGenerateTrigger');
const resetPageTrigger = inject<Ref<number>>('resetPageTrigger');

// 从外部数据获取选项列表
const genders = getGenders;
const raceCosts = getRaceCosts;
const identityCosts = getIdentityCosts;
const startLocations = getStartLocations;

const raceOptions = computed(() => Object.keys(raceCosts.value));
const identityOptions = computed(() => Object.keys(identityCosts.value));

// 计算当前等级的层级属性加成
const tierAttributeBonus = computed(() => getTierAttributeBonus(character.value.level));

const raceAttributeBonus = computed(() => {
  const displayRace = character.value.race === '自定义' ? character.value.customRace : character.value.race;
  return raceAttrs[displayRace] || { 力量: 0, 敏捷: 0, 体质: 0, 智力: 0, 精神: 0 };
});

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

// 监听随机生成事件
watch(
  () => randomGenerateTrigger?.value,
  () => {
    if (randomGenerateTrigger && randomGenerateTrigger.value > 0) {
      randomGenerate();
    }
  },
);

// 监听重置事件
watch(
  () => resetPageTrigger?.value,
  () => {
    if (resetPageTrigger && resetPageTrigger.value > 0) {
      resetPage();
    }
  },
);

// 随机生成基本信息
const randomGenerate = () => {
  // 随机性别（排除自定义）
  const genderList = genders.value.filter(g => g !== '自定义');
  character.value.gender = genderList[Math.floor(Math.random() * genderList.length)] || '男';

  // 随机年龄 (18-100)
  character.value.age = Math.floor(Math.random() * 83) + 18;

  // 随机种族（排除自定义）
  const races = raceOptions.value.filter(r => r !== '自定义');
  character.value.race = races[Math.floor(Math.random() * races.length)] || '人类';

  // 随机身份（排除自定义）
  const identities = identityOptions.value.filter(i => i !== '自定义');
  character.value.identity = identities[Math.floor(Math.random() * identities.length)] || '自由平民';

  // 随机等级 (1-10)
  character.value.level = Math.floor(Math.random() * MAX_LEVEL) + MIN_LEVEL;

  // 随机出生地（排除自定义）
  const locations = startLocations.value.filter(l => l !== '自定义');
  character.value.startLocation = locations[Math.floor(Math.random() * locations.length)] || '自定义';

  console.log('基本信息已随机生成');
};

// 重置页面
const resetPage = () => {
  character.value.name = '';
  character.value.gender = '男';
  character.value.customGender = '';
  character.value.age = 18;
  character.value.race = '人类';
  character.value.customRace = '';
  character.value.identity = '自由平民';
  character.value.customIdentity = '';
  character.value.level = 1;
  character.value.startLocation = '大陆东南部区域-索伦蒂斯王国';
  character.value.customStartLocation = '';

  console.log('基本信息已重置');
};
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
            :options="
              raceOptions.map(race => ({
                label:
                  race +
                  (raceCosts[race] !== 0 ? ` (${raceCosts[race] > 0 ? '-' : '+'}${Math.abs(raceCosts[race])}点)` : ''),
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

      <!-- 第四行：起始地点 -->
      <div class="form-row full-width">
        <div class="form-field">
          <FormLabel label="起始地点" required />
          <FormSelect v-model="character.startLocation" :options="startLocations" />
          <FormTextarea
            v-if="character.startLocation === '自定义'"
            v-model="character.customStartLocation"
            :rows="2"
            placeholder="请输入自定义起始地点"
          />
        </div>
      </div>

      <!-- 初始属性分配面板 -->
      <div class="attributes-panel">
        <div class="panel-header">
          <h3>初始属性分配</h3>
          <div class="ap-info">
            <span
              >剩余AP:
              <strong :class="{ error: characterStore.remainingAP < 0, success: characterStore.remainingAP === 0 }">{{
                characterStore.remainingAP
              }}</strong>
              / {{ characterStore.maxAP }}</span
            >
          </div>
        </div>

        <div class="panel-content">
          <div class="attributes-grid">
            <div v-for="attr in ATTRIBUTES" :key="attr" class="attribute-item">
              <FormStepper
                :model-value="character.attributePoints[attr]"
                :label="attr"
                :min="0"
                :max="characterStore.maxAP"
                :disable-increment="characterStore.remainingAP <= 0"
                @increment="addAttributePoint(attr)"
                @decrement="removeAttributePoint(attr)"
              />
              <div class="attribute-display">
                {{ BASE_STAT }} <span class="dim">(基础)</span> + {{ tierAttributeBonus }}
                <span class="dim">(层级)</span> + {{ raceAttributeBonus[attr] }} <span class="dim">(物种)</span> +
                {{ character.attributePoints[attr] }} <span class="dim">(额外)</span> =
                <strong class="final-value">{{ characterStore.finalAttributes[attr] }}</strong>
              </div>
            </div>
          </div>

          <div v-if="availableReincarnationPoints < 0" class="status-message error">⚠️ 转生点数不足！</div>
          <div v-else-if="characterStore.remainingAP === 0" class="status-message success">✓ 属性点已全部分配</div>
          <div v-else-if="characterStore.remainingAP > 0" class="status-message info">
            还有 {{ characterStore.remainingAP }} 点未分配
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
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);

  .panel-header {
    padding: var(--spacing-md) var(--spacing-lg);
    background: linear-gradient(to bottom, var(--primary-bg), var(--card-bg));
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-md);

    h3 {
      margin: 0;
      color: var(--title-color);
      font-size: 1.2rem;
      font-weight: 700;
    }

    .ap-info {
      font-size: 1rem;
      color: var(--text-color);

      strong {
        color: var(--accent-color);
        font-size: 1.2rem;

        &.error {
          color: var(--error-color);
        }

        &.success {
          color: var(--success-color);
        }
      }
    }
  }

  .panel-content {
    padding: var(--spacing-lg);
  }

  .attributes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
  }

  .attribute-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .attribute-display {
    font-size: 0.8rem;
    color: var(--text-color-secondary);
    text-align: center;
    padding: var(--spacing-xs) 0;
    background: var(--primary-bg);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-color);

    .dim {
      opacity: 0.7;
    }

    .final-value {
      color: var(--accent-color);
      font-weight: bold;
    }
  }

  .status-message {
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    text-align: center;
    font-weight: 600;
    font-size: 1rem;
    border: 1px solid;

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

    .attributes-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
