import { getLevelTierName, getTierAttributeBonus } from '../data/base-info';
import { RARITY_MAP } from '../data/constants';
import type { Background, CharacterConfig, Equipment, Item, Partner, Skill } from '../types';

/**
 * 将角色数据写入到 MVU 变量中
 * 使用 lodash 的 _.set 直接操作 stat_data，然后通过 replaceMvuData 写回
 */
export async function writeCharacterToMvu(
  character: CharacterConfig,
  items: Item[],
  skills: Skill[],
  partners: Partner[],
): Promise<void> {
  await waitGlobalInitialized('Mvu');

  const presetSkills = _.filter(skills, skill => !skill.isCustom);
  const presetItems = _.filter(items, item => !item.isCustom);
  const presetPartners = _.filter(partners, partner => !partner.isCustom);

  const mvuData = Mvu.getMvuData({ type: 'message', message_id: 'latest' });

  // 命运点数
  _.set(mvuData, 'stat_data.命定系统.命运点数', character.destinyPoints);

  // 新 schema: 主角.技能
  const skillsData = _.fromPairs(
    _.map(presetSkills, skill => [
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
  _.set(mvuData, 'stat_data.主角.技能', skillsData);

  // 新 schema: 主角.背包 / 主角.金钱
  const bagData = _.fromPairs(
    _.map(presetItems, item => [
      item.name,
      {
        品质: _.get(RARITY_MAP, item.rarity, '普通'),
        数量: item.quantity || 1,
        类型: item.type,
        标签: item.tag || [],
        效果: item.effect || {},
        描述: item.description,
      },
    ]),
  );
  _.set(mvuData, 'stat_data.主角.背包', bagData);
  _.set(mvuData, 'stat_data.主角.金钱', Math.max(0, Math.round(character.money)));
  _.set(mvuData, 'stat_data.主角.等级', character.level);

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
  _.set(mvuData, 'stat_data.命定系统.关系列表', relationData);

  // 将更新后的数据写回
  await Mvu.replaceMvuData(mvuData, { type: 'message', message_id: 'latest' });
  console.log('✅ 预设数据已成功写入消息楼层变量');
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
): string {
  const lines: string[] = [];
  const displayGender = character.gender === '自定义' ? character.customGender : character.gender;
  const displayRace = character.race === '自定义' ? character.customRace : character.race;
  const displayIdentity =
    character.identity === '自定义' ? character.customIdentity : character.identity;
  const displayLocation =
    character.startLocation === '自定义' ? character.customStartLocation : character.startLocation;

  const tierBonus = getTierAttributeBonus(character.level);
  const formatAttr = (attr: keyof typeof character.basePoints) => {
    const base = character.basePoints[attr];
    const extra = character.attributePoints[attr];
    const total = base + tierBonus + extra;
    return `${base}(基础) + ${tierBonus}(层级) + ${extra}(额外) = ${total}`;
  };

  // 基本信息
  lines.push('【角色信息】');
  lines.push(`姓名: ${character.name}`);
  lines.push(`性别: ${displayGender}`);
  lines.push(`年龄: ${character.age}岁`);
  lines.push(`种族: ${displayRace}`);
  lines.push(`身份: ${displayIdentity}`);
  lines.push(`出生地: ${displayLocation}`);
  lines.push(`生命层级: ${getLevelTierName(character.level)}`);
  lines.push(`等级: Lv.${character.level}`);
  lines.push('');
  lines.push('【角色属性】');
  lines.push(`力量: ${formatAttr('力量')}`);
  lines.push(`敏捷: ${formatAttr('敏捷')}`);
  lines.push(`体质: ${formatAttr('体质')}`);
  lines.push(`智力: ${formatAttr('智力')}`);
  lines.push(`精神: ${formatAttr('精神')}`);

  // 装备列表
  if (equipments.length > 0) {
    lines.push('');
    lines.push('【装备列表】');
    equipments.forEach((eq, index) => {
      lines.push(`- 名称: ${eq.name}`);
      lines.push(`  类型: ${eq.type}`);
      lines.push(`  品质: ${RARITY_MAP[eq.rarity] || eq.rarity}`);
      if (eq.tag && eq.tag.length > 0) lines.push(`  标签: ${eq.tag.join('、')}`);
      if (!_.isEmpty(eq.effect)) {
        lines.push('  效果:');
        _.forEach(eq.effect, (value, key) => {
          lines.push(`    - ${key}: ${value}`);
        });
      }
      if (eq.description) lines.push(`  描述: ${eq.description}`);
      // 在项目之间添加空行（末尾不加）
      if (index < equipments.length - 1) lines.push('');
    });
  }

  // 自定义道具
  const customItems = _.filter(items, 'isCustom');
  if (customItems.length > 0) {
    lines.push('');
    lines.push('【自定义道具】');
    customItems.forEach((item, index) => {
      lines.push(`- 名称: ${item.name || '未命名'}`);
      if (item.type) lines.push(`  类型: ${item.type}`);
      if (item.rarity) lines.push(`  品质: ${RARITY_MAP[item.rarity] || item.rarity}`);
      if (item.quantity) lines.push(`  数量: ${item.quantity}`);
      if (item.tag && item.tag.length > 0) lines.push(`  标签: ${item.tag.join('、')}`);
      if (!_.isEmpty(item.effect)) {
        lines.push('  效果:');
        _.forEach(item.effect, (value, key) => {
          lines.push(`    - ${key}: ${value}`);
        });
      }
      if (item.description) lines.push(`  描述: ${item.description}`);
      // 在项目之间添加空行（末尾不加）
      if (index < customItems.length - 1) lines.push('');
    });
  }

  // 自定义技能
  const customSkills = _.filter(skills, 'isCustom');
  if (customSkills.length > 0) {
    lines.push('');
    lines.push('【自定义技能】');
    customSkills.forEach((skill, index) => {
      lines.push(`- 名称: ${skill.name || '未命名'}`);
      if (skill.type) lines.push(`  类型: ${skill.type}`);
      if (skill.rarity) lines.push(`  品质: ${RARITY_MAP[skill.rarity] || skill.rarity}`);
      if (skill.tag && skill.tag.length > 0) lines.push(`  标签: ${skill.tag.join('、')}`);
      if (skill.consume) lines.push(`  消耗: ${skill.consume}`);
      if (!_.isEmpty(skill.effect)) {
        lines.push('  效果:');
        _.forEach(skill.effect, (value, key) => {
          lines.push(`    - ${key}: ${value}`);
        });
      }
      if (skill.description) lines.push(`  描述: ${skill.description}`);
      // 在项目之间添加空行（末尾不加）
      if (index < customSkills.length - 1) lines.push('');
    });
  }

  // 关系列表
  const customPartners = _.filter(partners, 'isCustom');
  if (customPartners.length > 0) {
    lines.push('');
    lines.push('【关系列表】');
    customPartners.forEach(partner => {
      lines.push(`◆ 名称: ${partner.name}`);
      lines.push(`  种族: ${partner.race}`);
      lines.push(`  身份: ${partner.identity.join('、')}`);
      if (partner.career.length > 0) lines.push(`  职业: ${partner.career.join('、')}`);
      lines.push(`  生命层级: ${partner.lifeLevel}`);
      lines.push(`  等级: ${partner.level}`);
      lines.push(`  性格: ${partner.personality}`);
      lines.push(`  喜爱: ${partner.like}`);
      lines.push(`  外貌: ${partner.app}`);
      lines.push(`  着装: ${partner.cloth}`);
      lines.push(`  属性:`);
      lines.push(`    力量: ${partner.attributes.strength}`);
      lines.push(`    敏捷: ${partner.attributes.dexterity}`);
      lines.push(`    体质: ${partner.attributes.constitution}`);
      lines.push(`    智力: ${partner.attributes.intelligence}`);
      lines.push(`    精神: ${partner.attributes.mind}`);
      lines.push(`  命定契约: ${partner.isContract}`);
      lines.push(`  好感度: ${partner.affinity}`);
      if (!_.isEmpty(partner.equip)) {
        const validEquips = _.filter(partner.equip, 'name');
        if (validEquips.length > 0) {
          lines.push(`  装备:`);
          validEquips.forEach((eq, eqIndex) => {
            lines.push(`    - 名称: ${eq.name}`);
            if (eq.type) lines.push(`      类型: ${eq.type}`);
            if (eq.rarity) lines.push(`      品质: ${RARITY_MAP[eq.rarity] || eq.rarity}`);
            if (eq.tag && eq.tag.length > 0) lines.push(`      标签: ${eq.tag.join('、')}`);
            if (!_.isEmpty(eq.effect)) {
              lines.push('      效果:');
              _.forEach(eq.effect, (value, key) => {
                lines.push(`        - ${key}: ${value}`);
              });
            }
            if (eq.description) lines.push(`      描述: ${eq.description}`);
            // 在装备之间添加空行（末尾不加）
            if (eqIndex < validEquips.length - 1) lines.push('');
          });
        }
      }
      if (partner.stairway.isOpen) {
        lines.push(`  登神长阶: 已开启`);
        const stairwayDesc =
          _.get(partner.stairway, 'elements.custom.desc') ||
          _.chain(partner.stairway.elements)
            .values()
            .map(value => value?.desc || '')
            .find(Boolean)
            .value();
        if (stairwayDesc) lines.push(`    描述: ${stairwayDesc}`);
      }
      if (partner.comment) lines.push(`  心里话: ${partner.comment}`);
      if (partner.backgroundInfo) lines.push(`  背景: ${partner.backgroundInfo}`);
      if (partner.skills.length > 0) {
        lines.push(`  技能:`);
        partner.skills.forEach((sk, skIndex) => {
          lines.push(`    - 名称: ${sk.name}`);
          if (sk.type) lines.push(`      类型: ${sk.type}`);
          if (sk.rarity) lines.push(`      品质: ${RARITY_MAP[sk.rarity] || sk.rarity}`);
          if (sk.tag && sk.tag.length > 0) lines.push(`      标签: ${sk.tag.join('、')}`);
          if (sk.consume) lines.push(`      消耗: ${sk.consume}`);
          if (!_.isEmpty(sk.effect)) {
            lines.push('      效果:');
            _.forEach(sk.effect, (value, key) => {
              lines.push(`        - ${key}: ${value}`);
            });
          }
          if (sk.description) lines.push(`      描述: ${sk.description}`);
          // 在技能之间添加空行（末尾不加）
          if (skIndex < partner.skills.length - 1) lines.push('');
        });
      }
    });
  }

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
