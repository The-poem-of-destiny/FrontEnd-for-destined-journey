import {
  ATTRIBUTES,
  calculateAPByLevel,
  getLevelTierName,
  getTierAttributeBonus,
} from '../data/base-info';
import { RARITY_MAP } from '../data/constants';
import type {
  Attributes,
  Background,
  CharacterConfig,
  Equipment,
  Item,
  Partner,
  Skill,
} from '../types';

type MvuItemSource = {
  name?: string;
  rarity?: string;
  type?: string;
  tag?: string[];
  effect?: Record<string, string>;
  description?: string;
};

type MvuEquipmentSource = MvuItemSource & {
  position?: string;
};

type MvuSkillSource = MvuItemSource & {
  consume?: string;
};

const getRarityName = (rarity?: string) => _.get(RARITY_MAP, rarity || '', rarity || '普通');

const cleanRecord = (record?: Record<string, string>) => _.pickBy(record || {}, value => !!value);

const toBaseItemVariable = (item: MvuItemSource) => ({
  品质: getRarityName(item.rarity),
  类型: item.type || '',
  标签: _.uniq(item.tag || []),
  效果: cleanRecord(item.effect),
  描述: item.description || '',
});

const toEquipmentVariable = (item: MvuEquipmentSource) => ({
  ...toBaseItemVariable(item),
  位置: item.position || '',
});

const toInventoryVariable = (item: Item) => ({
  ...toBaseItemVariable(item),
  数量: Math.max(1, Math.round(item.quantity || 1)),
});

const toSkillVariable = (skill: MvuSkillSource) => ({
  ...toBaseItemVariable(skill),
  消耗: skill.consume || '',
});

const toNamedRecord = <T extends { name?: string }, V>(
  list: T[],
  mapper: (item: T) => V,
): Record<string, V> =>
  _.fromPairs(
    _.chain(list)
      .filter(item => !!item.name)
      .map(item => [item.name as string, mapper(item)])
      .value(),
  );

const getCharacterDisplayValues = (character: CharacterConfig) => ({
  race: character.race === '自定义' ? character.customRace : character.race,
  identity: character.identity === '自定义' ? character.customIdentity : character.identity,
});

const calculateFinalAttributes = (character: CharacterConfig): Attributes => {
  const tierBonus = getTierAttributeBonus(character.level);
  return _.fromPairs(
    _.map(ATTRIBUTES, attr => [
      attr,
      character.basePoints[attr] + tierBonus + character.attributePoints[attr],
    ]),
  ) as Attributes;
};

const toAscensionVariable = (stairway?: Partner['stairway']) => ({
  是否开启: Boolean(stairway?.isOpen),
  要素: stairway?.elements ?? {},
  权能: stairway?.powers ?? {},
  法则: stairway?.laws ?? {},
  神位: stairway?.godlyRank ?? '',
  神国: stairway?.godKingdom
    ? {
        名称: stairway.godKingdom.name || '',
        描述: stairway.godKingdom.description || '',
      }
    : {
        名称: '',
        描述: '',
      },
});

const toPartnerVariable = (partner: Partner) => ({
  在场: true,
  生命层级: partner.lifeLevel,
  等级: partner.level,
  种族: partner.race,
  身份: [...partner.identity],
  职业: [...partner.career],
  性格: partner.personality,
  喜爱: partner.like,
  外貌: partner.app,
  着装: partner.cloth,
  属性: {
    力量: partner.attributes.strength,
    敏捷: partner.attributes.dexterity,
    体质: partner.attributes.constitution,
    智力: partner.attributes.intelligence,
    精神: partner.attributes.mind,
  },
  状态效果: {},
  背包: {},
  装备: toNamedRecord(partner.equip, toEquipmentVariable),
  技能: toNamedRecord(partner.skills, toSkillVariable),
  登神长阶: toAscensionVariable(partner.stairway),
  命定契约: partner.isContract,
  好感度: partner.affinity,
  心里话: partner.comment || '',
  背景故事: partner.backgroundInfo || '',
});

/**
 * 将角色数据写入到 MVU 变量中
 * 使用 lodash 的 _.set 直接操作 stat_data，然后通过 replaceMvuData 写回
 */
export async function writeCharacterToMvu(
  character: CharacterConfig,
  equipments: Equipment[],
  items: Item[],
  skills: Skill[],
  partners: Partner[],
): Promise<void> {
  await waitGlobalInitialized('Mvu');

  const mvuData = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
  const displayValues = getCharacterDisplayValues(character);
  const maxAp = calculateAPByLevel(character.level);
  const usedAp = _.sum(_.values(character.attributePoints));

  // 命运点数
  _.set(mvuData, 'stat_data.命运点数', character.destinyPoints);
  _.set(mvuData, 'stat_data.主角', {
    种族: displayValues.race || '',
    身份: displayValues.identity ? [displayValues.identity] : [],
    职业: [],
    生命层级: getLevelTierName(character.level),
    等级: character.level,
    累计经验值: 0,
    升级所需经验: character.level >= 25 ? 'MAX' : 120,
    冒险者等级: '未评级',
    属性点: Math.max(0, maxAp - usedAp),
    属性: calculateFinalAttributes(character),
    生命值上限: 0,
    生命值: 0,
    法力值上限: 0,
    法力值: 0,
    体力值上限: 0,
    体力值: 0,
    状态效果: {},
    金钱: Math.max(0, Math.round(character.money)),
    背包: toNamedRecord(items, toInventoryVariable),
    装备: toNamedRecord(equipments, toEquipmentVariable),
    技能: toNamedRecord(skills, toSkillVariable),
    登神长阶: toAscensionVariable(),
  });
  _.set(mvuData, 'stat_data.关系列表', toNamedRecord(partners, toPartnerVariable));

  // 将更新后的数据写回
  await Mvu.replaceMvuData(mvuData, { type: 'message', message_id: 'latest' });
  console.log('✅ 角色结构化数据已成功写入消息楼层变量');
}

/**
 * 生成发送给 AI 的提示词数据（纯文本格式）
 */
export function generateAIPrompt(
  character: CharacterConfig,
  background: Background | null,
  customBackgroundDescription?: string,
): string {
  const lines: string[] = [];
  const displayGender = character.gender === '自定义' ? character.customGender : character.gender;
  const displayLocation =
    character.startLocation === '自定义' ? character.customStartLocation : character.startLocation;

  lines.push('【剧情生成上下文】');
  lines.push(
    '角色、属性、金钱、装备、背包、技能、伙伴等结构化数据已写入 <status_current_variables>。',
  );
  lines.push('以下只提供 schema 外字段和需要创作的开局上下文。');
  lines.push('');
  lines.push(`姓名: ${character.name || '未命名'}`);
  lines.push(`性别: ${displayGender || '未设置'}`);
  lines.push(`年龄: ${character.age}岁`);
  lines.push(`起始地点: ${displayLocation || '未设置'}`);
  lines.push('');
  lines.push('【第一轮变量更新要求】');
  lines.push(
    '第一轮 AI 回复必须同步更新 <status_current_variables> 中的以下字段，不要保留空值或 0 占位：',
  );
  lines.push('- 世界.时间');
  lines.push('- 世界.地点');
  lines.push('- 主角.生命值上限 / 主角.生命值');
  lines.push('- 主角.法力值上限 / 主角.法力值');
  lines.push('- 主角.体力值上限 / 主角.体力值');
  lines.push('- 主角.装备.*.位置');

  // 初始开局剧情
  if (background) {
    lines.push('');
    lines.push('【初始开局剧情】');
    lines.push(`${background.name}`);
    // 自定义开局使用用户输入的描述，否则使用预设描述
    const description =
      background.name === '【自定义开局】' && customBackgroundDescription
        ? customBackgroundDescription
        : background.description;
    lines.push(`描述: ${description}`);
  }

  const content = lines.join('\n');
  const instructions = `---
根据<status_current_variables>和以上内容，生成一个符合描述和情景的初始剧情！
（注意：生成初始剧情时，先检查上述内容是否完整，如不完整，必须参考相关设定进行完善。）`;

  return `\`\`\`text\n${content}\n\`\`\`\n\n${instructions}`;
}
