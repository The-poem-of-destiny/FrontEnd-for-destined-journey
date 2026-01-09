<script setup lang="ts">
import { klona } from 'klona';
import { computed, ref, watch } from 'vue';
import ConfirmModal from '../../../components/ConfirmModal.vue';
import {
  FormArrayInput,
  FormInput,
  FormLabel,
  FormNumber,
  FormRadio,
  FormTextarea,
} from '../../../components/Form';
import { useCustomContentStore } from '../../../store/customContent';
import type { DestinedOne, Rarity } from '../../../types';
import { calculateDestinedCost } from '../../../utils/cost-calculator';
import AttributeEditor, { type Attributes } from './AttributeEditor.vue';
import EquipmentEditor, { type EquipmentItem } from './EquipmentEditor.vue';
import SkillEditor, { type SkillItem } from './SkillEditor.vue';

interface Emits {
  (e: 'add', item: DestinedOne): void;
}

const emit = defineEmits<Emits>();
const customContentStore = useCustomContentStore();
const isExpanded = ref(false);

// 层级与等级的映射关系
const LEVEL_GRADE_MAP: Record<number, { name: string; minGrade: number; maxGrade: number }> = {
  1: { name: '第一层级 (普通)', minGrade: 1, maxGrade: 4 },
  2: { name: '第二层级 (中坚)', minGrade: 5, maxGrade: 8 },
  3: { name: '第三层级 (精英)', minGrade: 9, maxGrade: 12 },
  4: { name: '第四层级 (史诗)', minGrade: 13, maxGrade: 16 },
  5: { name: '第五层级 (传说)', minGrade: 17, maxGrade: 20 },
  6: { name: '第六层级 (神话)', minGrade: 21, maxGrade: 24 },
  7: { name: '第七层级 (神祗)', minGrade: 25, maxGrade: 25 },
};
// 契约选项
const contractOptions = [
  { label: '是', value: true },
  { label: '否', value: false },
];

// 表单数据 - 使用 computed 双向绑定，通过函数访问确保响应式
const itemName = computed({
  get: () => customContentStore.customDestinedOneForm.itemName,
  set: (v: string) => customContentStore.updateCustomDestinedOneForm('itemName', v),
});
const itemLevel = computed({
  get: () => customContentStore.customDestinedOneForm.itemLevel,
  set: (v: number) => customContentStore.updateCustomDestinedOneForm('itemLevel', v),
});
const itemLifeLevel = computed({
  get: () => customContentStore.customDestinedOneForm.itemLifeLevel,
  set: (v: string) => customContentStore.updateCustomDestinedOneForm('itemLifeLevel', v),
});
const itemGrade = computed({
  get: () => customContentStore.customDestinedOneForm.itemGrade,
  set: (v: number) => customContentStore.updateCustomDestinedOneForm('itemGrade', v),
});
const itemRace = computed({
  get: () => customContentStore.customDestinedOneForm.itemRace,
  set: (v: string) => customContentStore.updateCustomDestinedOneForm('itemRace', v),
});
const itemIdentity = computed({
  get: () => customContentStore.customDestinedOneForm.itemIdentity,
  set: (v: string[]) => customContentStore.updateCustomDestinedOneForm('itemIdentity', v),
});
const itemCareer = computed({
  get: () => customContentStore.customDestinedOneForm.itemCareer,
  set: (v: string[]) => customContentStore.updateCustomDestinedOneForm('itemCareer', v),
});
const itemPersonality = computed({
  get: () => customContentStore.customDestinedOneForm.itemPersonality,
  set: (v: string) => customContentStore.updateCustomDestinedOneForm('itemPersonality', v),
});
const itemLike = computed({
  get: () => customContentStore.customDestinedOneForm.itemLike,
  set: (v: string) => customContentStore.updateCustomDestinedOneForm('itemLike', v),
});
const itemApp = computed({
  get: () => customContentStore.customDestinedOneForm.itemApp,
  set: (v: string) => customContentStore.updateCustomDestinedOneForm('itemApp', v),
});
const itemCloth = computed({
  get: () => customContentStore.customDestinedOneForm.itemCloth,
  set: (v: string) => customContentStore.updateCustomDestinedOneForm('itemCloth', v),
});
const itemEquip = computed({
  get: () => customContentStore.customDestinedOneForm.itemEquip,
  set: (v: EquipmentItem[]) => customContentStore.updateCustomDestinedOneForm('itemEquip', v),
});
const itemAttributes = computed({
  get: () => customContentStore.customDestinedOneForm.itemAttributes,
  set: (v: Attributes) => customContentStore.updateCustomDestinedOneForm('itemAttributes', v),
});
const itemStairway = computed({
  get: () => customContentStore.customDestinedOneForm.itemStairway,
  set: (v: string) => customContentStore.updateCustomDestinedOneForm('itemStairway', v),
});
const itemIsContract = computed({
  get: () => customContentStore.customDestinedOneForm.itemIsContract,
  set: (v: boolean) => customContentStore.updateCustomDestinedOneForm('itemIsContract', v),
});
const itemAffinity = computed({
  get: () => customContentStore.customDestinedOneForm.itemAffinity,
  set: (v: number) => customContentStore.updateCustomDestinedOneForm('itemAffinity', v),
});
const itemComment = computed({
  get: () => customContentStore.customDestinedOneForm.itemComment,
  set: (v: string) => customContentStore.updateCustomDestinedOneForm('itemComment', v),
});
const itemBackgroundInfo = computed({
  get: () => customContentStore.customDestinedOneForm.itemBackgroundInfo,
  set: (v: string) => customContentStore.updateCustomDestinedOneForm('itemBackgroundInfo', v),
});
const itemSkills = computed({
  get: () => customContentStore.customDestinedOneForm.itemSkills,
  set: (v: SkillItem[]) => customContentStore.updateCustomDestinedOneForm('itemSkills', v),
});

// 确认弹窗状态
const showResetConfirm = ref(false);
const showAddConfirm = ref(false);

// 计算属性
const calculatedCost = computed(() => calculateDestinedCost(itemLevel.value));
const currentLevelInfo = computed(() => LEVEL_GRADE_MAP[itemLevel.value]);
const isValid = computed(() => itemName.value.trim() !== '' && itemRace.value.trim() !== '');

// 监听层级变化
watch(
  () => itemLevel.value,
  newLevel => {
    const levelInfo = LEVEL_GRADE_MAP[newLevel];
    if (levelInfo) {
      itemLifeLevel.value = levelInfo.name;
      if (itemGrade.value < levelInfo.minGrade || itemGrade.value > levelInfo.maxGrade) {
        itemGrade.value = levelInfo.minGrade;
      }
    }
  },
  { immediate: true },
);

// 重置表单
const resetForm = () => {
  customContentStore.resetCustomDestinedOneForm();
  const levelInfo = LEVEL_GRADE_MAP[itemLevel.value];
  if (levelInfo) itemLifeLevel.value = levelInfo.name;
};

// 请求清空确认
const requestReset = () => {
  showResetConfirm.value = true;
};

// 确认清空
const confirmReset = () => {
  showResetConfirm.value = false;
  resetForm();
};

// 取消清空
const cancelReset = () => {
  showResetConfirm.value = false;
};

// 请求添加确认
const requestAdd = () => {
  if (!isValid.value) return;
  showAddConfirm.value = true;
};

// 取消添加
const cancelAdd = () => {
  showAddConfirm.value = false;
};

// 解析登神长阶
const parseStairway = (str: string) => {
  if (!str.trim()) return { isOpen: false };
  return { isOpen: true, elements: { 描述: str } };
};

// 添加自定义命定之人（确认后执行）
const confirmAdd = () => {
  showAddConfirm.value = false;

  const newItem: DestinedOne = {
    name: itemName.value.trim(),
    cost: calculatedCost.value,
    lifeLevel: itemLifeLevel.value.trim() || '未知',
    level: itemGrade.value,
    race: itemRace.value.trim(),
    identity: klona(itemIdentity.value),
    career: klona(itemCareer.value),
    personality: itemPersonality.value.trim() || '未知',
    like: itemLike.value.trim() || '未知',
    app: itemApp.value.trim() || '未知',
    cloth: itemCloth.value.trim() || '未知',
    equip: klona(itemEquip.value).map(e => ({ ...e, rarity: e.rarity as Rarity })),
    attributes: klona(itemAttributes.value),
    stairway: parseStairway(itemStairway.value),
    isContract: itemIsContract.value,
    affinity: itemAffinity.value,
    comment: itemComment.value.trim(),
    backgroundInfo: itemBackgroundInfo.value.trim(),
    skills: klona(itemSkills.value).map(s => ({ ...s, rarity: s.rarity as Rarity })),
    isCustom: true,
  };

  emit('add', newItem);
  resetForm();
};
</script>

<template>
  <div class="custom-destined-form" :class="{ expanded: isExpanded }">
    <div class="form-header" @click="isExpanded = !isExpanded">
      <div class="header-left">
        <h3 class="form-title">✨ 自定义命定之人</h3>
        <div class="form-desc">创建您的专属命定之人</div>
      </div>
      <div class="toggle-icon" :class="{ rotated: isExpanded }">▼</div>
    </div>

    <div v-show="isExpanded" class="form-body">
      <!-- 姓名 -->
      <div class="form-row">
        <FormLabel label="姓名" required />
        <FormInput v-model="itemName" placeholder="请输入姓名" :maxlength="50" />
      </div>

      <!-- 层级 -->
      <div class="form-row">
        <FormLabel label="层级" required />
        <div class="level-buttons">
          <button
            v-for="level in 7"
            :key="level"
            class="level-btn"
            :class="{ active: itemLevel === level }"
            @click="itemLevel = level"
          >
            第{{ ['一', '二', '三', '四', '五', '六', '七'][level - 1] }}层级
          </button>
        </div>
        <div class="cost-info">
          <span class="cost-label">消耗点数：</span>
          <span class="cost-value">{{ calculatedCost }}</span>
        </div>
      </div>

      <!-- 生命层级（自动填充） -->
      <div class="form-row">
        <FormLabel label="生命层级（根据层级自动填充）" />
        <FormInput v-model="itemLifeLevel" readonly disabled />
      </div>

      <!-- 等级 -->
      <div class="form-row">
        <FormLabel :label="`等级（${currentLevelInfo.minGrade}-${currentLevelInfo.maxGrade}级）`" />
        <FormNumber
          v-model="itemGrade"
          :min="currentLevelInfo.minGrade"
          :max="currentLevelInfo.maxGrade"
          :placeholder="`${currentLevelInfo.minGrade}-${currentLevelInfo.maxGrade}`"
        />
        <div class="field-hint">
          该层级的等级范围：{{ currentLevelInfo.minGrade }}-{{ currentLevelInfo.maxGrade }}级
        </div>
      </div>

      <!-- 种族 -->
      <div class="form-row">
        <FormLabel label="种族" required />
        <FormInput v-model="itemRace" placeholder="例如：人类、精灵等" :maxlength="20" />
      </div>

      <!-- 身份 -->
      <div class="form-row">
        <FormLabel label="身份" />
        <FormArrayInput v-model="itemIdentity" placeholder="输入身份后按回车添加" />
      </div>

      <!-- 职业 -->
      <div class="form-row">
        <FormLabel label="职业" />
        <FormArrayInput v-model="itemCareer" placeholder="输入职业后按回车添加" />
      </div>

      <!-- 性格 -->
      <div class="form-row">
        <FormLabel label="性格" />
        <FormInput v-model="itemPersonality" placeholder="描述角色的性格特征..." />
      </div>

      <!-- 喜爱 -->
      <div class="form-row">
        <FormLabel label="喜爱" />
        <FormTextarea v-model="itemLike" placeholder="描述喜好和习惯..." :rows="2" />
      </div>

      <!-- 外貌 -->
      <div class="form-row">
        <FormLabel label="外貌" />
        <FormTextarea v-model="itemApp" placeholder="描述外貌特征..." :rows="2" />
      </div>

      <!-- 衣物 -->
      <div class="form-row">
        <FormLabel label="着装" />
        <FormTextarea v-model="itemCloth" placeholder="描述穿着打扮..." :rows="2" />
      </div>

      <!-- 属性 -->
      <div class="form-row">
        <FormLabel label="属性" />
        <AttributeEditor v-model="itemAttributes" :min="1" :max="20" />
      </div>

      <!-- 装备 -->
      <div class="form-row">
        <FormLabel label="装备" />
        <EquipmentEditor v-model="itemEquip" :max-items="10" />
      </div>

      <!-- 技能 -->
      <div class="form-row">
        <FormLabel label="技能" />
        <SkillEditor v-model="itemSkills" :max-items="10" />
      </div>

      <!-- 登神长阶 -->
      <div class="form-row">
        <FormLabel label="登神长阶（需等级 ≥ 13）" />
        <FormTextarea
          v-model="itemStairway"
          :disabled="itemGrade < 13"
          :placeholder="itemGrade >= 13 ? '描述登神长阶信息...' : '等级需达到 13 级或以上才可填写'"
          :rows="2"
        />
        <div v-if="itemGrade < 13" class="field-hint">
          ⚠️ 当前等级 {{ itemGrade }} 级，需要达到 13 级才能开启登神长阶
        </div>
      </div>

      <!-- 是否缔结契约 -->
      <div class="form-row">
        <FormLabel label="是否缔结契约" />
        <FormRadio v-model="itemIsContract" :options="contractOptions" />
      </div>

      <!-- 好感度 -->
      <div class="form-row">
        <FormLabel label="好感度 (-100~100)" />
        <FormNumber v-model="itemAffinity" :min="-100" :max="100" placeholder="49" />
      </div>

      <!-- 心里话 -->
      <div class="form-row">
        <FormLabel label="心里话" />
        <FormTextarea v-model="itemComment" placeholder="该角色对你的评价..." :rows="2" />
      </div>

      <!-- 背景故事 -->
      <div class="form-row">
        <FormLabel label="背景故事" />
        <FormTextarea v-model="itemBackgroundInfo" placeholder="描述背景故事..." :rows="3" />
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <button class="btn-reset" @click="requestReset">清空</button>
        <button class="btn-submit" :disabled="!isValid" @click="requestAdd">添加到已选项目</button>
      </div>
    </div>

    <!-- 清空确认弹窗 -->
    <ConfirmModal
      :visible="showResetConfirm"
      title="确认清空"
      message="确定要清空所有已填写的内容吗？此操作不可撤销。"
      confirm-text="确认清空"
      cancel-text="取消"
      type="danger"
      @confirm="confirmReset"
      @cancel="cancelReset"
    />

    <!-- 添加确认弹窗 -->
    <ConfirmModal
      :visible="showAddConfirm"
      title="确认添加"
      :message="`确定要将「${itemName}」添加到已选项目吗？`"
      confirm-text="确认添加"
      cancel-text="取消"
      type="info"
      @confirm="confirmAdd"
      @cancel="cancelAdd"
    />
  </div>
</template>

<style lang="scss" scoped>
.custom-destined-form {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);

  &:not(.expanded) {
    .form-header {
      border-bottom: none;
    }
  }

  .form-header {
    padding: var(--spacing-md) var(--spacing-lg);
    background: linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(139, 69, 19, 0.05) 100%);
    border-bottom: 2px solid var(--border-color);
    cursor: pointer;
    user-select: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all var(--transition-fast);

    &:hover {
      background: linear-gradient(135deg, rgba(139, 69, 19, 0.15) 0%, rgba(139, 69, 19, 0.08) 100%);
    }

    .header-left {
      flex: 1;
    }

    .form-title {
      font-size: 1.1rem;
      margin: 0 0 var(--spacing-xs) 0;
      color: var(--title-color);
      font-weight: 700;
    }

    .form-desc {
      font-size: 0.85rem;
      color: var(--text-light);
    }

    .toggle-icon {
      font-size: 0.9rem;
      color: var(--text-light);
      transition: transform var(--transition-fast);
      margin-left: var(--spacing-md);

      &.rotated {
        transform: rotate(180deg);
      }
    }
  }

  .form-body {
    padding: var(--spacing-lg);
    max-height: 70vh;
    overflow-y: auto;
  }

  .form-row {
    margin-bottom: var(--spacing-md);

    &:last-child {
      margin-bottom: 0;
    }
  }

  .level-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--spacing-xs);
  }

  .level-btn {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: 0.85rem;
    color: var(--text-color);
    white-space: nowrap;

    &:hover {
      border-color: var(--accent-color);
      background: rgba(212, 175, 55, 0.1);
    }

    &.active {
      background: var(--accent-color);
      border-color: var(--accent-color);
      color: var(--primary-bg);
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(212, 175, 55, 0.3);
    }
  }

  .cost-info {
    margin-top: var(--spacing-xs);
    font-size: 0.85rem;
    color: var(--text-light);

    .cost-value {
      font-size: 1rem;
      font-weight: 700;
      color: var(--accent-color);
      font-family: var(--font-mono);
      margin: 0 var(--spacing-xs);
    }
  }

  .form-actions {
    display: flex;
    gap: var(--spacing-md);
    margin-top: var(--spacing-lg);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--border-color);
  }

  .btn-reset,
  .btn-submit {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-lg);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all var(--transition-fast);
  }

  .btn-reset {
    background: var(--input-bg);
    color: var(--text-color);
    border: 1px solid var(--border-color);

    &:hover {
      background: var(--card-bg);
      border-color: var(--border-color-strong);
    }
  }

  .btn-submit {
    background: var(--accent-color);
    color: var(--primary-bg);

    &:hover:not(:disabled) {
      background: #c9a842;
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .field-hint {
    margin-top: var(--spacing-xs);
    font-size: 0.8rem;
    color: var(--text-light);
    font-style: italic;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .custom-destined-form {
    .form-header {
      padding: var(--spacing-sm) var(--spacing-md);

      .header-left {
        .form-title {
          font-size: 1rem;
        }

        .form-desc {
          font-size: 0.8rem;
        }
      }

      .toggle-icon {
        font-size: 0.85rem;
      }
    }

    .form-body {
      padding: var(--spacing-md);
      max-height: 60vh;
    }

    .form-row {
      margin-bottom: var(--spacing-sm);
    }

    .level-buttons {
      grid-template-columns: repeat(2, 1fr);
    }

    .level-btn {
      padding: 6px var(--spacing-sm);
      font-size: 0.8rem;
    }

    .form-actions {
      flex-direction: column;
      gap: var(--spacing-sm);
    }
  }
}
</style>
