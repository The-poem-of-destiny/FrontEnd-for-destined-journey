<script setup lang="ts">
import { computed } from 'vue';
import { useCharacterStore } from '../../store/character';
import { useCustomContentStore } from '../../store/customContent';

const characterStore = useCharacterStore();
const customContentStore = useCustomContentStore();

// 计算总消耗点数
const totalConsumed = computed(() => characterStore.consumedPoints);

// 计算剩余点数
const remainingPoints = computed(() => {
  return characterStore.character.reincarnationPoints - totalConsumed.value;
});

// 获取显示的性别
const displayGender = computed(() => {
  return characterStore.character.gender === '自定义'
    ? characterStore.character.customGender || '自定义'
    : characterStore.character.gender;
});

// 获取显示的种族
const displayRace = computed(() => {
  return characterStore.character.race === '自定义'
    ? characterStore.character.customRace || '自定义'
    : characterStore.character.race;
});

// 获取显示的身份
const displayIdentity = computed(() => {
  return characterStore.character.identity === '自定义'
    ? characterStore.character.customIdentity || '自定义'
    : characterStore.character.identity;
});

// 获取显示的出生地
const displayLocation = computed(() => {
  return characterStore.character.startLocation === '自定义'
    ? characterStore.character.customStartLocation || '自定义'
    : characterStore.character.startLocation;
});

// 品质颜色映射
const rarityColorMap: Record<string, string> = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800',
  mythic: '#e91e63',
  only: '#ff0000',
};
</script>

<template>
  <div class="confirm-page">
    <div class="confirm-panel">
      <!-- 标题 -->
      <div class="panel-header">
        <h2 class="panel-title">信息确认</h2>
        <p class="panel-subtitle">非自定义数据（除了装备）会直接写入 MVU 变量中，不会发送给 AI</p>
      </div>

      <!-- 文档内容 -->
      <div class="panel-content">
        <!-- 点数统计 -->
        <section class="doc-section points-section">
          <div class="points-grid">
            <div class="point-item">
              <span class="point-label">转生点数</span>
              <span class="point-value gold">{{
                characterStore.character.reincarnationPoints
              }}</span>
            </div>
            <div class="point-item">
              <span class="point-label">已消耗</span>
              <span class="point-value">{{ totalConsumed }}</span>
            </div>
            <div class="point-item">
              <span class="point-label">剩余</span>
              <span
                class="point-value"
                :class="{ negative: remainingPoints < 0, positive: remainingPoints >= 0 }"
              >
                {{ remainingPoints }}
              </span>
            </div>
            <div class="point-item destiny">
              <span class="point-label">命运点数</span>
              <span class="point-value purple">{{ characterStore.character.destinyPoints }}</span>
            </div>
          </div>
        </section>

        <!-- 基本信息 -->
        <section class="doc-section">
          <h3 class="section-title">📋 基本信息</h3>
          <div class="doc-text">
            <p><strong>姓名：</strong>{{ characterStore.character.name || '（未设置）' }}</p>
            <p><strong>性别：</strong>{{ displayGender }}</p>
            <p><strong>年龄：</strong>{{ characterStore.character.age }} 岁</p>
            <p><strong>种族：</strong>{{ displayRace }}</p>
            <p><strong>身份：</strong>{{ displayIdentity }}</p>
            <p><strong>出生地：</strong>{{ displayLocation }}</p>
            <p><strong>等级：</strong>Lv.{{ characterStore.character.level }}</p>
          </div>
        </section>

        <!-- 属性 -->
        <section class="doc-section">
          <h3 class="section-title">⚔️ 角色属性</h3>
          <div class="doc-text attributes">
            <p v-for="(value, attr) in characterStore.finalAttributes" :key="attr">
              <strong>{{ attr }}：</strong>
              <span class="attr-detail">
                {{ value }}
              </span>
            </p>
          </div>
        </section>

        <!-- 装备 -->
        <section class="doc-section">
          <h3 class="section-title">🛡️ 装备 ({{ characterStore.selectedEquipments.length }})</h3>
          <div v-if="characterStore.selectedEquipments.length > 0" class="doc-text">
            <div
              v-for="(item, index) in characterStore.selectedEquipments"
              :key="item.name"
              class="item-entry"
            >
              <p class="item-title">
                <strong>{{ index + 1 }}. </strong>
                <span :style="{ color: rarityColorMap[item.rarity] }">{{ item.name }}</span>
                <span class="item-cost">[{{ item.cost }} 点]</span>
              </p>
              <p class="item-meta">
                类型：{{ item.type }}<span v-if="item.tag"> | 标签：{{ item.tag }}</span>
              </p>
              <p class="item-desc">效果：{{ item.effect }}</p>
              <p v-if="item.description" class="item-flavor">{{ item.description }}</p>
            </div>
          </div>
          <p v-else class="empty-text">未选择装备</p>
        </section>

        <!-- 道具 -->
        <section class="doc-section">
          <h3 class="section-title">🎒 道具 ({{ characterStore.selectedItems.length }})</h3>
          <div v-if="characterStore.selectedItems.length > 0" class="doc-text">
            <div
              v-for="(item, index) in characterStore.selectedItems"
              :key="item.name"
              class="item-entry"
            >
              <p class="item-title">
                <strong>{{ index + 1 }}. </strong>
                <span :style="{ color: rarityColorMap[item.rarity] }">{{ item.name }}</span>
                <span v-if="item.quantity" class="item-quantity">× {{ item.quantity }}</span>
                <span class="item-cost">[{{ item.cost }} 点]</span>
              </p>
              <p class="item-meta">
                类型：{{ item.type }}<span v-if="item.tag"> | 标签：{{ item.tag }}</span>
              </p>
              <p class="item-desc">效果：{{ item.effect }}</p>
              <p v-if="item.description" class="item-flavor">{{ item.description }}</p>
            </div>
          </div>
          <p v-else class="empty-text">未选择道具</p>
        </section>

        <!-- 技能 -->
        <section class="doc-section">
          <h3 class="section-title">✨ 技能 ({{ characterStore.selectedSkills.length }})</h3>
          <div v-if="characterStore.selectedSkills.length > 0" class="doc-text">
            <div
              v-for="(skill, index) in characterStore.selectedSkills"
              :key="skill.name"
              class="item-entry"
            >
              <p class="item-title">
                <strong>{{ index + 1 }}. </strong>
                <span :style="{ color: rarityColorMap[skill.rarity] }">{{ skill.name }}</span>
                <span class="item-cost">[{{ skill.cost }} 点]</span>
              </p>
              <p class="item-meta">
                类型：{{ skill.type }}
                <span v-if="skill.tag"> | 标签：{{ skill.tag }}</span>
                <span v-if="skill.consume"> | 消耗：{{ skill.consume }}</span>
              </p>
              <p class="item-desc">效果：{{ skill.effect }}</p>
              <p v-if="skill.description" class="item-flavor">{{ skill.description }}</p>
            </div>
          </div>
          <p v-else class="empty-text">未选择技能</p>
        </section>

        <!-- 命定之人 -->
        <section class="doc-section">
          <h3 class="section-title">
            🌟 命定之人 ({{ characterStore.selectedDestinedOnes.length }})
          </h3>
          <div v-if="characterStore.selectedDestinedOnes.length > 0" class="doc-text">
            <div
              v-for="(one, index) in characterStore.selectedDestinedOnes"
              :key="one.name"
              class="destined-entry"
            >
              <p class="item-title">
                <strong>{{ index + 1 }}. {{ one.name }}</strong>
                <span class="item-cost">[{{ one.cost }} 点]</span>
              </p>
              <p class="item-meta">
                {{ one.race }} | {{ one.identity.join('、') }} | Lv.{{ one.level }} |
                {{ one.lifeLevel }}
              </p>
              <p v-if="one.backgroundInfo">{{ one.backgroundInfo }}</p>
              <p v-if="one.comment" class="item-flavor">{{ one.comment }}</p>

              <div v-if="one.equip && one.equip.length > 0" class="sub-list">
                <p><strong>装备：</strong></p>
                <p v-for="(eq, idx) in one.equip" :key="idx" class="sub-item">
                  • {{ eq.name || eq }}
                </p>
              </div>

              <div v-if="one.skills && one.skills.length > 0" class="sub-list">
                <p><strong>技能：</strong></p>
                <p v-for="(sk, idx) in one.skills" :key="idx" class="sub-item">• {{ sk.name }}</p>
              </div>
            </div>
          </div>
          <p v-else class="empty-text">未选择命定之人</p>
        </section>

        <!-- 初始开局 -->
        <section class="doc-section">
          <h3 class="section-title">📖 初始开局剧情</h3>
          <div v-if="characterStore.selectedBackground" class="doc-text">
            <p class="item-title">
              <strong>{{ characterStore.selectedBackground.name }}</strong>
            </p>
            <p
              v-if="
                characterStore.selectedBackground.race || characterStore.selectedBackground.location
              "
              class="item-meta"
            >
              <span v-if="characterStore.selectedBackground.race"
                >种族：{{ characterStore.selectedBackground.race }}</span
              >
              <span
                v-if="
                  characterStore.selectedBackground.race &&
                  characterStore.selectedBackground.location
                "
              >
                |
              </span>
              <span v-if="characterStore.selectedBackground.location"
                >地点：{{ characterStore.selectedBackground.location }}</span
              >
            </p>
            <!-- 自定义开局显示用户输入的内容，否则显示预设描述 -->
            <p
              v-if="
                characterStore.selectedBackground.name === '【自定义开局】' &&
                customContentStore.customBackgroundDescription
              "
              class="background-desc"
            >
              {{ customContentStore.customBackgroundDescription }}
            </p>
            <p v-else class="background-desc">
              {{ characterStore.selectedBackground.description }}
            </p>
          </div>
          <p v-else class="empty-text">未选择初始开局剧情</p>
        </section>

        <!-- 提示信息 -->
        <div v-if="remainingPoints !== 0" class="final-notice">
          <div v-if="remainingPoints < 0" class="notice warning">
            ⚠️ 警告：转生点数不足 {{ Math.abs(remainingPoints) }} 点，请返回调整
          </div>
          <div v-else class="notice info">💡 提示：还有 {{ remainingPoints }} 点转生点数未使用</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.confirm-page {
  max-width: 900px;
  margin: 0 auto;
}

.confirm-panel {
  overflow: hidden;
}

.panel-header {
  text-align: center;
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
  border-bottom: 2px solid var(--border-color);

  .panel-title {
    font-size: 1.6rem;
    color: var(--title-color);
    margin: 0 0 var(--spacing-xs) 0;
    font-weight: 700;
  }

  .panel-subtitle {
    font-size: 0.95rem;
    color: var(--text-light);
    margin: 0;
  }
}

.panel-content {
  padding: var(--spacing-lg);
}

// 点数统计区域
.points-section {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(212, 175, 55, 0.02) 100%);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-md) !important;
  margin-bottom: var(--spacing-lg) !important;
}

.points-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);

  .point-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm);
    background: var(--card-bg);
    border-radius: var(--radius-md);

    &.destiny {
      background: linear-gradient(
        135deg,
        rgba(156, 39, 176, 0.1) 0%,
        rgba(156, 39, 176, 0.05) 100%
      );
    }

    .point-label {
      font-size: 0.85rem;
      color: var(--text-light);
      font-weight: 500;
    }

    .point-value {
      font-size: 1.5rem;
      font-weight: 700;
      font-family: var(--font-mono);
      color: var(--text-color);

      &.gold {
        color: var(--accent-color);
      }

      &.purple {
        color: #9c27b0;
      }

      &.positive {
        color: var(--success-color);
      }

      &.negative {
        color: var(--error-color);
      }
    }
  }
}

// 文档区块
.doc-section {
  padding: var(--spacing-lg) 0;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }
}

.section-title {
  font-size: 1.2rem;
  color: var(--title-color);
  margin: 0 0 var(--spacing-md) 0;
  font-weight: 700;
}

.doc-text {
  line-height: 1.8;
  color: var(--text-color);

  p {
    margin: 0 0 var(--spacing-sm) 0;

    &:last-child {
      margin-bottom: 0;
    }

    strong {
      color: var(--text-light);
      font-weight: 600;
    }
  }

  &.attributes {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm) var(--spacing-lg);

    .attr-detail {
      font-family: var(--font-mono);
      color: var(--accent-color);
      font-weight: 700;
      font-size: 1.1em;
    }
  }
}

// 物品条目
.item-entry,
.destined-entry {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px dashed var(--border-color-light);

  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .item-title {
    font-size: 1.05rem;
    margin-bottom: var(--spacing-xs) !important;

    .item-quantity {
      font-size: 0.9rem;
      color: #4caf50;
      font-weight: 600;
      margin-left: var(--spacing-xs);
    }

    .item-cost {
      font-size: 0.9rem;
      color: var(--accent-color);
      font-weight: 600;
      font-family: var(--font-mono);
      margin-left: var(--spacing-xs);
    }
  }

  .item-meta {
    font-size: 0.9rem;
    color: var(--text-light);
    margin-bottom: var(--spacing-xs) !important;
  }

  .item-desc {
    margin-bottom: var(--spacing-xs) !important;
  }

  .item-flavor {
    font-size: 0.9rem;
    color: var(--text-light);
    font-style: italic;
  }

  .sub-list {
    margin-top: var(--spacing-sm);
    padding-left: var(--spacing-md);

    p {
      margin-bottom: 4px !important;

      strong {
        color: var(--text-color);
      }
    }

    .sub-item {
      font-size: 0.95rem;
      color: var(--text-light);
    }
  }
}

.background-story,
.background-desc {
  white-space: pre-wrap;
  line-height: 1.8;
}

.empty-text {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--text-light);
  font-style: italic;
}

// 最终提示
.final-notice {
  margin-top: var(--spacing-lg);

  .notice {
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    font-size: 0.95rem;
    font-weight: 600;
    text-align: center;

    &.warning {
      background: rgba(244, 67, 54, 0.1);
      color: var(--error-color);
      border: 2px solid var(--error-color);
    }

    &.info {
      background: rgba(33, 150, 243, 0.1);
      color: #2196f3;
      border: 2px solid #2196f3;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .panel-header {
    padding: var(--spacing-md);

    .panel-title {
      font-size: 1.3rem;
    }
  }

  .panel-content {
    padding: var(--spacing-md);
  }

  .points-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .doc-text.attributes {
    grid-template-columns: 1fr;
  }

  .item-entry,
  .destined-entry {
    margin-bottom: var(--spacing-md);
    padding-bottom: var(--spacing-md);
  }
}
</style>
