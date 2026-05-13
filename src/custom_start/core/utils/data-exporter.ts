import { getLevelTierName, getTierAttributeBonus } from '../data/base-info';
import { RARITY_MAP } from '../data/constants';
import type { Background, CharacterConfig, Equipment, Item, Partner, Skill } from '../types';

export interface JourneyInjectOptions {
  injectResources: boolean;
  injectCustomItems: boolean;
  injectCustomSkills: boolean;
}

const DEFAULT_JOURNEY_INJECT_OPTIONS: JourneyInjectOptions = {
  injectResources: false,
  injectCustomItems: false,
  injectCustomSkills: false,
};

const RESOURCE_MULTIPLIERS = [
  { min: 1, max: 4, hp: 1, mpSp: 1 },
  { min: 5, max: 8, hp: 2, mpSp: 2.5 },
  { min: 9, max: 12, hp: 4, mpSp: 6 },
  { min: 13, max: 16, hp: 10, mpSp: 15 },
  { min: 17, max: 20, hp: 20, mpSp: 35 },
  { min: 21, max: 24, hp: 40, mpSp: 80 },
  { min: 25, max: Number.POSITIVE_INFINITY, hp: 100, mpSp: 160 },
] as const;

const resolveDisplayRace = (character: CharacterConfig) =>
  character.race === '自定义' ? character.customRace : character.race;

const resolveDisplayIdentity = (character: CharacterConfig) =>
  character.identity === '自定义' ? character.customIdentity : character.identity;

const resolveDisplayLocation = (character: CharacterConfig) =>
  character.startLocation === '自定义' ? character.customStartLocation : character.startLocation;

const splitIdentity = (identity: string) =>
  identity
    .split(/[、,，/]/)
    .map(item => item.trim())
    .filter(Boolean);

const getFinalAttributes = (character: CharacterConfig) => {
  const tierBonus = getTierAttributeBonus(character.level);
  return {
    力量: character.basePoints.力量 + tierBonus + character.attributePoints.力量,
    敏捷: character.basePoints.敏捷 + tierBonus + character.attributePoints.敏捷,
    体质: character.basePoints.体质 + tierBonus + character.attributePoints.体质,
    智力: character.basePoints.智力 + tierBonus + character.attributePoints.智力,
    精神: character.basePoints.精神 + tierBonus + character.attributePoints.精神,
  };
};

const getResourceMultiplier = (level: number) =>
  RESOURCE_MULTIPLIERS.find(row => level >= row.min && level <= row.max) || RESOURCE_MULTIPLIERS[0];

export function calculateMainResources(character: CharacterConfig) {
  const attributes = getFinalAttributes(character);
  const multiplier = getResourceMultiplier(character.level);
  const attrSum = _.sum(_.values(attributes));

  const hp = Math.round(attributes.体质 * 100 * multiplier.hp + attrSum);
  const mp = Math.round((attributes.智力 + attributes.精神) * 50 * multiplier.mpSp);
  const sp = Math.round((attributes.力量 + attributes.敏捷) * 50 * multiplier.mpSp);

  return { hp, mp, sp, attributes, multiplier };
}

const toMvuItem = (item: Item) => ({
  品质: _.get(RARITY_MAP, item.rarity, item.rarity || '普通'),
  数量: item.quantity || 1,
  类型: item.type,
  标签: item.tag || [],
  效果: item.effect || {},
  描述: item.description,
});

const toMvuSkill = (skill: Skill) => ({
  品质: _.get(RARITY_MAP, skill.rarity, skill.rarity || '普通'),
  类型: skill.type,
  消耗: skill.consume || '',
  标签: skill.tag || [],
  效果: skill.effect || {},
  描述: skill.description,
});

const toMvuEquipment = (equipment: Equipment) => ({
  品质: _.get(RARITY_MAP, equipment.rarity, equipment.rarity || '普通'),
  类型: equipment.type,
  标签: equipment.tag || [],
  效果: equipment.effect || {},
  描述: equipment.description,
  位置: equipment.position || 'Help ME Fill In',
});

const escapeJsonPointer = (str: string) => String(str).replace(/~/g, '~0').replace(/\//g, '~1');

const formatEffectLines = (effect: Record<string, string>, indent = '    ') =>
  _.flatMap(effect, (value, key) => [`${indent}- ${key}: ${value}`]);

/**
 * 将角色数据写入到 MVU 变量中
 * 使用 lodash 的 _.set 直接操作 stat_data，然后通过 TavernHelper 变量函数写回指定楼层
 */
export async function writeCharacterToMvu(
  character: CharacterConfig,
  items: Item[],
  skills: Skill[],
  partners: Partner[],
  equipments: Equipment[] = [],
  options: JourneyInjectOptions = DEFAULT_JOURNEY_INJECT_OPTIONS,
  messageId: number | 'latest' = 'latest',
): Promise<void> {
  const injectOptions = { ...DEFAULT_JOURNEY_INJECT_OPTIONS, ...options };
  const presetSkills = _.filter(skills, skill => !skill.isCustom);
  const presetItems = _.filter(items, item => !item.isCustom);
  const presetPartners = _.filter(partners, partner => !partner.isCustom);
  const skillsForMvu = injectOptions.injectCustomSkills ? skills : presetSkills;
  const itemsForMvu = injectOptions.injectCustomItems ? items : presetItems;

  const variableOption: VariableOption = { type: 'message', message_id: messageId };
  const mvuData = {
    stat_data: {},
  };

  const displayRace = resolveDisplayRace(character);
  const displayIdentity = resolveDisplayIdentity(character);
  const displayLevelTier = getLevelTierName(character.level);
  const finalAttributes = getFinalAttributes(character);

  _.set(mvuData, 'stat_data.主角.种族', displayRace);
  _.set(mvuData, 'stat_data.主角.身份', splitIdentity(displayIdentity));
  _.set(mvuData, 'stat_data.主角.生命层级', displayLevelTier);
  _.set(mvuData, 'stat_data.主角.等级', character.level);
  _.set(mvuData, 'stat_data.主角.属性', finalAttributes);

  if (injectOptions.injectResources) {
    const resources = calculateMainResources(character);
    _.set(mvuData, 'stat_data.主角.生命值上限', resources.hp);
    _.set(mvuData, 'stat_data.主角.生命值', resources.hp);
    _.set(mvuData, 'stat_data.主角.法力值上限', resources.mp);
    _.set(mvuData, 'stat_data.主角.法力值', resources.mp);
    _.set(mvuData, 'stat_data.主角.体力值上限', resources.sp);
    _.set(mvuData, 'stat_data.主角.体力值', resources.sp);
  }

  // 命运点数
  _.set(mvuData, 'stat_data.命运点数', character.destinyPoints);

  // 新 schema: 主角.技能
  const skillsData = _.fromPairs(_.map(skillsForMvu, skill => [skill.name, toMvuSkill(skill)]));
  _.set(mvuData, 'stat_data.主角.技能', skillsData);

  // 新 schema: 主角.背包 / 主角.金钱
  const bagData = _.fromPairs(_.map(itemsForMvu, item => [item.name, toMvuItem(item)]));
  _.set(mvuData, 'stat_data.主角.背包', bagData);
  _.set(mvuData, 'stat_data.主角.金钱', Math.max(0, Math.round(character.money)));
  _.set(mvuData, 'stat_data.主角.等级', character.level);

  const equipmentData = _.fromPairs(
    _.map(equipments, equipment => [equipment.name, toMvuEquipment(equipment)]),
  );
  _.set(mvuData, 'stat_data.主角.装备', equipmentData);

  // 关系列表
  const relationData = _.fromPairs(
    _.map(presetPartners, partner => {
      // 装备数据：过滤有 name 的装备，转为以 name 为键的对象
      const equipData = _.fromPairs(
        _.chain(partner.equip)
          .filter(eq => !!eq.name)
          .map(eq => [
            eq.name,
            {
              品质: _.get(RARITY_MAP, eq.rarity || '', '普通'),
              类型: eq.type || '',
              标签: eq.tag || [],
              效果: eq.effect || {},
              描述: eq.description || '',
              位置: eq.position || '',
            },
          ])
          .value(),
      );

      // 技能数据
      const skillData = _.fromPairs(
        _.map(partner.skills, skill => [
          skill.name,
          {
            品质: _.get(RARITY_MAP, skill.rarity, '普通'),
            类型: skill.type,
            消耗: skill.consume || '',
            标签: skill.tag || [],
            效果: skill.effect || {},
            描述: skill.description,
          },
        ]),
      );

      return [
        partner.name,
        {
          // 新 schema: 关系列表字段
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
          登神长阶: {
            是否开启: partner.stairway.isOpen,
            要素: partner.stairway.elements ?? {},
            权能: partner.stairway.powers ?? {},
            法则: partner.stairway.laws ?? {},
            神位: partner.stairway.godlyRank ?? '',
            神国: partner.stairway.godKingdom
              ? {
                  名称: partner.stairway.godKingdom.name,
                  描述: partner.stairway.godKingdom.description,
                }
              : { 名称: '', 描述: '' },
          },
          命定契约: partner.isContract,
          好感度: partner.affinity,
          心里话: partner.comment || '',
          背景故事: partner.backgroundInfo || '',
          装备: equipData,
          技能: skillData,
        },
      ];
    }),
  );
  _.set(mvuData, 'stat_data.关系列表', relationData);

  // 将更新后的数据直接写回目标消息楼层变量。
  insertOrAssignVariables({ stat_data: mvuData.stat_data }, variableOption);
  console.log(`✅ 预设数据已成功写入消息楼层变量 #${String(messageId)}`);
}

/**
 * 生成发送给 AI 的提示词数据（纯文本格式）
 */
export function generateAIPrompt(
  character: CharacterConfig,
  equipments: Equipment[],
  partners: Partner[],
  background: Background | null,
  items: Item[],
  skills: Skill[],
  customBackgroundDescription?: string,
  options: JourneyInjectOptions = DEFAULT_JOURNEY_INJECT_OPTIONS,
): string {
  const injectOptions = { ...DEFAULT_JOURNEY_INJECT_OPTIONS, ...options };
  const displayGender = character.gender === '自定义' ? character.customGender : character.gender;
  const displayLocation = resolveDisplayLocation(character);

  const resources = calculateMainResources(character);
  const customItems = _.filter(items, 'isCustom');
  const customSkills = _.filter(skills, 'isCustom');
  const customPartners = _.filter(partners, 'isCustom');
  const fallbackSections: string[] = [];
  const resourceText = injectOptions.injectResources
    ? `HP/MP/SP: 已由脚本写入（HP ${resources.hp} / MP ${resources.mp} / SP ${resources.sp}）`
    : 'HP/MP/SP: 未计算';

  fallbackSections.push(
    [
      '【角色信息】',
      `- 姓名: ${character.name}`,
      `- 性别: ${displayGender}`,
      `- 年龄: ${character.age}岁`,
      `- 地点: ${displayLocation}`,
      `- ${resourceText}`,
    ].join('\n'),
  );

  if (!injectOptions.injectCustomItems && customItems.length > 0) {
    const section = ['【自定义道具】'];
    customItems.forEach((item, index) => {
      section.push(`- 名称: ${item.name || '未命名'}`);
      if (item.type) section.push(`  类型: ${item.type}`);
      if (item.rarity) section.push(`  品质: ${RARITY_MAP[item.rarity] || item.rarity}`);
      if (item.quantity) section.push(`  数量: ${item.quantity}`);
      if (item.tag && item.tag.length > 0) section.push(`  标签: ${item.tag.join('、')}`);
      if (!_.isEmpty(item.effect)) {
        section.push('  效果:');
        section.push(...formatEffectLines(item.effect));
      }
      if (item.description) section.push(`  描述: ${item.description}`);
      if (index < customItems.length - 1) section.push('');
    });
    fallbackSections.push(section.join('\n'));
  }

  if (!injectOptions.injectCustomSkills && customSkills.length > 0) {
    const section = ['【自定义技能】'];
    customSkills.forEach((skill, index) => {
      section.push(`- 名称: ${skill.name || '未命名'}`);
      if (skill.type) section.push(`  类型: ${skill.type}`);
      if (skill.rarity) section.push(`  品质: ${RARITY_MAP[skill.rarity] || skill.rarity}`);
      if (skill.tag && skill.tag.length > 0) section.push(`  标签: ${skill.tag.join('、')}`);
      if (skill.consume) section.push(`  消耗: ${skill.consume}`);
      if (!_.isEmpty(skill.effect)) {
        section.push('  效果:');
        section.push(...formatEffectLines(skill.effect));
      }
      if (skill.description) section.push(`  描述: ${skill.description}`);
      if (index < customSkills.length - 1) section.push('');
    });
    fallbackSections.push(section.join('\n'));
  }

  if (customPartners.length > 0) {
    const section = ['【关系列表】'];
    customPartners.forEach(partner => {
      section.push(`◆ 名称: ${partner.name}`);
      section.push(`  种族: ${partner.race}`);
      section.push(`  身份: ${partner.identity.join('、')}`);
      if (partner.career.length > 0) section.push(`  职业: ${partner.career.join('、')}`);
      section.push(`  生命层级: ${partner.lifeLevel}`);
      section.push(`  等级: ${partner.level}`);
      section.push(`  性格: ${partner.personality}`);
      section.push(`  喜爱: ${partner.like}`);
      section.push(`  外貌: ${partner.app}`);
      section.push(`  着装: ${partner.cloth}`);
      section.push(`  属性:`);
      section.push(`    力量: ${partner.attributes.strength}`);
      section.push(`    敏捷: ${partner.attributes.dexterity}`);
      section.push(`    体质: ${partner.attributes.constitution}`);
      section.push(`    智力: ${partner.attributes.intelligence}`);
      section.push(`    精神: ${partner.attributes.mind}`);
      section.push(`  命定契约: ${partner.isContract}`);
      section.push(`  好感度: ${partner.affinity}`);

      const validEquips = _.filter(partner.equip, 'name');
      if (validEquips.length > 0) {
        section.push(`  装备:`);
        validEquips.forEach(eq => {
          section.push(`    - 名称: ${eq.name}`);
          if (eq.type) section.push(`      类型: ${eq.type}`);
          if (eq.rarity) section.push(`      品质: ${RARITY_MAP[eq.rarity] || eq.rarity}`);
          if (eq.tag && eq.tag.length > 0) section.push(`      标签: ${eq.tag.join('、')}`);
          if (!_.isEmpty(eq.effect)) {
            section.push('      效果:');
            section.push(...formatEffectLines(eq.effect as Record<string, string>, '        '));
          }
          if (eq.description) section.push(`      描述: ${eq.description}`);
        });
      }

      if (partner.stairway.isOpen) {
        section.push(`  登神长阶: 已开启`);
        const stairwayDesc =
          _.get(partner.stairway, 'elements.custom.desc') ||
          _.chain(partner.stairway.elements)
            .values()
            .map(value => value?.desc || '')
            .find(Boolean)
            .value();
        if (stairwayDesc) section.push(`    描述: ${stairwayDesc}`);
      }
      if (partner.comment) section.push(`  心里话: ${partner.comment}`);
      if (partner.backgroundInfo) section.push(`  背景: ${partner.backgroundInfo}`);

      if (partner.skills.length > 0) {
        section.push(`  技能:`);
        partner.skills.forEach(sk => {
          section.push(`    - 名称: ${sk.name}`);
          if (sk.type) section.push(`      类型: ${sk.type}`);
          if (sk.rarity) section.push(`      品质: ${RARITY_MAP[sk.rarity] || sk.rarity}`);
          if (sk.tag && sk.tag.length > 0) section.push(`      标签: ${sk.tag.join('、')}`);
          if (sk.consume) section.push(`      消耗: ${sk.consume}`);
          if (!_.isEmpty(sk.effect)) {
            section.push('      效果:');
            section.push(...formatEffectLines(sk.effect, '        '));
          }
          if (sk.description) section.push(`      描述: ${sk.description}`);
        });
      }
    });
    fallbackSections.push(section.join('\n'));
  }

  let backgroundSection = '';
  if (background) {
    // 自定义开局使用用户输入的描述，否则使用预设描述
    const description =
      background.name === '【自定义开局】' && customBackgroundDescription
        ? customBackgroundDescription
        : background.description;
    backgroundSection = [`${background.name}`, `描述: ${description}`].join('\n');
  }

  const equipmentPatchTemplate = equipments.length
    ? `[\n${equipments
        .map(
          equipment =>
            `  { "op": "replace", "path": "/主角/装备/${escapeJsonPointer(equipment.name)}/位置", "value": "YYY" }`,
        )
        .join(',\n')}\n]`
    : '';

  const blocks = [];
  blocks.push('检查<status_current_variables>是否完整，如不完整，必须参考相关设定进行完善');
  blocks.push('');
  blocks.push('# 待处理内容');
  blocks.push(fallbackSections.length ? fallbackSections.join('\n\n') : '（无额外内容）');

  if (equipmentPatchTemplate) {
    blocks.push('');
    blocks.push('# 装备位置补全 JSON Patch 模板');
    blocks.push(
      '已使用占位符标记欠缺的`装备/位置`，LLM要合理地补上装备位置。**仅补全 value，不用改 path**',
    );
    blocks.push(`\`\`\`json\n${equipmentPatchTemplate}\n\`\`\``);
  }

  blocks.push('');
  blocks.push('# 初始开局剧情');
  blocks.push(backgroundSection || '未选择初始开局剧情');
  blocks.push('');
  blocks.push('---');
  blocks.push('当前为自定义开局，无需审查。生成一个符合描述和情景的初始剧情，并在回复末尾输出 UpdateVariable JSONPatch。');

  return `<custom_start_data>\n${blocks.join('\n')}\n</custom_start_data>`;
}
