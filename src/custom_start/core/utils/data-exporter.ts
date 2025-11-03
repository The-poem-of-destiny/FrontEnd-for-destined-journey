import { BASE_STAT, getTierAttributeBonus } from '../data/base-info';
import { RARITY_MAP } from '../data/constants';
import type { Background, CharacterConfig, DestinedOne, Equipment, Item, Skill } from '../types';

/**
 * 解析货币描述，提取金币、银币、铜币数量
 */
function parseCurrency(description: string): { gold: number; silver: number; copper: number } {
  const result = { gold: 0, silver: 0, copper: 0 };

  // 匹配金币
  const goldMatch = description.match(/(\d+)金币/);
  if (goldMatch) result.gold = parseInt(goldMatch[1]);

  // 匹配银币
  const silverMatch = description.match(/(\d+)银币/);
  if (silverMatch) result.silver = parseInt(silverMatch[1]);

  // 匹配铜币
  const copperMatch = description.match(/(\d+)铜币/);
  if (copperMatch) result.copper = parseInt(copperMatch[1]);

  return result;
}

/**
 * 将角色数据写入到 MVU 变量中
 * 使用 parseMessage 模拟 MVU 命令来保持可扩展性
 */
export async function writeCharacterToMvu(
  character: CharacterConfig,
  items: Item[],
  skills: Skill[],
  destinedOnes: DestinedOne[],
): Promise<void> {
  // 等待 Mvu 初始化
  await waitGlobalInitialized('Mvu');

  // 过滤掉自定义数据（只写入预设数据到 MVU）
  const presetSkills = skills.filter(skill => !skill.isCustom);
  const presetItems = items.filter(item => !item.isCustom);
  const presetDestinedOnes = destinedOnes.filter(one => !one.isCustom);

  // 获取当前 MVU 数据以便清空现有条目
  const chatMvuData = Mvu.getMvuData({ type: 'chat' });
  const messageMvuData = Mvu.getMvuData({ type: 'message', message_id: 'latest' });

  // 构建 MVU 命令字符串
  const mvuCommands: string[] = [];

  // 写入命运点数
  mvuCommands.push(`_.set('命定系统.命运点数', ${character.destinyPoints}); // 初始化命运点数`);

  // 清空技能列表中的现有技能
  const existingSkills = Mvu.getMvuVariable(chatMvuData, '技能列表', { default_value: {} });
  for (const skillName of Object.keys(existingSkills)) {
    mvuCommands.push(`_.delete('技能列表', '${skillName}'); // 删除旧技能：${skillName}`);
  }
  // 然后写入新技能（只写入预设技能）
  for (const skill of presetSkills) {
    const skillData = {
      品质: RARITY_MAP[skill.rarity] || '普通',
      类型: skill.type,
      消耗: skill.consume || '',
      标签: skill.tag,
      效果: skill.effect,
      描述: skill.description,
    };
    mvuCommands.push(`_.insert('技能列表', '${skill.name}', ${JSON.stringify(skillData)}); // 添加技能：${skill.name}`);
  }

  // 初始化货币并清空背包中的现有道具
  mvuCommands.push(`_.set('财产.货币.金币', 0); // 初始化金币`);
  mvuCommands.push(`_.set('财产.货币.银币', 0); // 初始化银币`);
  mvuCommands.push(`_.set('财产.货币.铜币', 0); // 初始化铜币`);

  const existingItems = Mvu.getMvuVariable(chatMvuData, '财产.背包', { default_value: {} });
  for (const itemName of Object.keys(existingItems)) {
    mvuCommands.push(`_.delete('财产.背包', '${itemName}'); // 删除旧道具：${itemName}`);
  }
  // 然后写入道具（只写入预设道具，区分货币和普通道具）
  for (const item of presetItems) {
    // 检查是否是货币类型
    if (item.type === '货币') {
      // 解析货币描述，提取金币、银币、铜币
      const currency = parseCurrency(item.description);

      // 写入到货币变量
      if (currency.gold > 0) {
        mvuCommands.push(`_.add('财产.货币.金币', ${currency.gold}); // 添加金币`);
      }
      if (currency.silver > 0) {
        mvuCommands.push(`_.add('财产.货币.银币', ${currency.silver}); // 添加银币`);
      }
      if (currency.copper > 0) {
        mvuCommands.push(`_.add('财产.货币.铜币', ${currency.copper}); // 添加铜币`);
      }
    } else {
      // 普通道具添加到背包
      const itemData = {
        品质: RARITY_MAP[item.rarity] || '普通',
        数量: 1,
        类型: item.type,
        标签: item.tag,
        效果: item.effect,
        描述: item.description,
      };
      mvuCommands.push(`_.insert('财产.背包', '${item.name}', ${JSON.stringify(itemData)}); // 添加道具：${item.name}`);
    }
  }

  // 清空命定之人列表中的现有命定之人
  const existingDestinedOnes = Mvu.getMvuVariable(chatMvuData, '命定系统.命定之人', { default_value: {} });
  for (const oneName of Object.keys(existingDestinedOnes)) {
    mvuCommands.push(`_.delete('命定系统.命定之人', '${oneName}'); // 删除旧命定之人：${oneName}`);
  }
  // 然后写入命定之人（只写入预设命定之人）
  for (const one of presetDestinedOnes) {
    // 创建命定之人数据对象
    const oneData: Record<string, any> = {
      是否在场: '是',
      生命层级: one.lifeLevel,
      等级: one.level,
      种族: one.race,
      身份: [...one.identity],
      职业: [...one.career],
      性格: one.personality,
      喜爱: one.like,
      外貌特质: one.app,
      衣物装饰: one.cloth,
      属性: {
        力量: one.attributes.strength,
        敏捷: one.attributes.dexterity,
        体质: one.attributes.constitution,
        智力: one.attributes.intelligence,
        精神: one.attributes.mind,
      },
      登神长阶: {
        是否开启: one.stairway.isOpen ? '是' : '否',
      },
      是否缔结契约: one.isContract,
      好感度: one.affinity,
      评价: one.comment || '',
      背景故事: one.backgroundInfo || '',
      装备: {},
      技能: {},
    };

    // 添加装备
    for (const eq of one.equip) {
      if (eq.name) {
        oneData.装备[eq.name] = {
          品质: eq.rarity ? RARITY_MAP[eq.rarity] || '普通' : '普通',
          类型: eq.type || '',
          标签: eq.tag || '',
          效果: eq.effect || '',
          描述: eq.description || '',
        };
      }
    }

    // 添加技能
    for (const skill of one.skills) {
      oneData.技能[skill.name] = {
        品质: RARITY_MAP[skill.rarity] || '普通',
        类型: skill.type,
        消耗: skill.consume || '',
        标签: skill.tag,
        效果: skill.effect,
        描述: skill.description,
      };
    }

    mvuCommands.push(
      `_.insert('命定系统.命定之人', '${one.name}', ${JSON.stringify(oneData)}); // 添加命定之人：${one.name}`,
    );
  }

  // 使用 parseMessage 解析命令并更新聊天变量和消息楼层变量
  const commandMessage = mvuCommands.join('\n');

  const updatedChatData = await Mvu.parseMessage(commandMessage, chatMvuData);
  const updatedMessageData = await Mvu.parseMessage(commandMessage, messageMvuData);

  if (updatedChatData && updatedMessageData) {
    await Mvu.replaceMvuData(updatedChatData, { type: 'chat' });
    await Mvu.replaceMvuData(updatedMessageData, { type: 'message', message_id: 'latest' });
    console.log('✅ 预设数据已成功写入聊天变量和消息楼层变量（保持可扩展性）');
  } else {
    console.warn('⚠️ MVU 命令解析失败，数据未写入');
  }
}

/**
 * 生成发送给 AI 的提示词数据
 */
export function generateAIPrompt(
  character: CharacterConfig,
  equipments: Equipment[],
  destinedOnes: DestinedOne[],
  background: Background | null,
  items: Item[],
  skills: Skill[],
): string {
  const parts: string[] = [];

  parts.push('# 角色信息\n');

  // 基本信息
  const displayGender = character.gender === '自定义' ? character.customGender : character.gender;
  const displayRace = character.race === '自定义' ? character.customRace : character.race;
  const displayIdentity = character.identity === '自定义' ? character.customIdentity : character.identity;
  const displayLocation =
    character.startLocation === '自定义' ? character.customStartLocation : character.startLocation;

  parts.push(`## 基本信息`);
  parts.push(`- 姓名：${character.name}`);
  parts.push(`- 性别：${displayGender}`);
  parts.push(`- 年龄：${character.age} 岁`);
  parts.push(`- 种族：${displayRace}`);
  parts.push(`- 身份：${displayIdentity}`);
  parts.push(`- 出生地：${displayLocation}`);
  parts.push(`- 等级：Lv.${character.level}`);

  // 角色属性
  const tierBonus = getTierAttributeBonus(character.level);
  const finalAttrs = {
    力量: BASE_STAT + tierBonus + character.attributePoints.力量,
    敏捷: BASE_STAT + tierBonus + character.attributePoints.敏捷,
    体质: BASE_STAT + tierBonus + character.attributePoints.体质,
    智力: BASE_STAT + tierBonus + character.attributePoints.智力,
    精神: BASE_STAT + tierBonus + character.attributePoints.精神,
  };

  parts.push(`\n## 角色属性`);
  parts.push(`- 力量：${finalAttrs.力量}`);
  parts.push(`- 敏捷：${finalAttrs.敏捷}`);
  parts.push(`- 体质：${finalAttrs.体质}`);
  parts.push(`- 智力：${finalAttrs.智力}`);
  parts.push(`- 精神：${finalAttrs.精神}`);

  // 装备详情
  if (equipments.length > 0) {
    parts.push(`\n## 装备列表`);
    equipments.forEach((eq, idx) => {
      parts.push(`\n### ${idx + 1}. ${eq.name}`);
      parts.push(`- 类型：${eq.type}`);
      parts.push(`- 品质：${RARITY_MAP[eq.rarity] || eq.rarity}`);
      if (eq.tag) parts.push(`- 标签：${eq.tag}`);
      parts.push(`- 效果：${eq.effect}`);
      if (eq.description) parts.push(`- 描述：${eq.description}`);
    });
  }

  // 自定义道具列表（全部发送给 AI）
  const customItems = items.filter(item => item.isCustom);
  if (customItems.length > 0) {
    parts.push(`\n## 自定义道具列表`);
    customItems.forEach((item, idx) => {
      parts.push(`\n### ${idx + 1}. ${item.name || '未命名'}`);
      if (item.type) parts.push(`- 类型：${item.type}`);
      if (item.rarity) parts.push(`- 品质：${RARITY_MAP[item.rarity] || item.rarity}`);
      if (item.tag) parts.push(`- 标签：${item.tag}`);
      if (item.effect) parts.push(`- 效果：${item.effect}`);
      if (item.description) parts.push(`- 描述：${item.description}`);
    });
  }

  // 自定义技能列表（全部发送给 AI）
  const customSkills = skills.filter(skill => skill.isCustom);
  if (customSkills.length > 0) {
    parts.push(`\n## 自定义技能列表`);
    customSkills.forEach((skill, idx) => {
      parts.push(`\n### ${idx + 1}. ${skill.name || '未命名'}`);
      if (skill.type) parts.push(`- 类型：${skill.type}`);
      if (skill.rarity) parts.push(`- 品质：${RARITY_MAP[skill.rarity] || skill.rarity}`);
      if (skill.tag) parts.push(`- 标签：${skill.tag}`);
      if (skill.consume) parts.push(`- 消耗：${skill.consume}`);
      if (skill.effect) parts.push(`- 效果：${skill.effect}`);
      if (skill.description) parts.push(`- 描述：${skill.description}`);
    });
  }

  // 自定义命定之人
  const customOnes = destinedOnes.filter(one => one.isCustom);
  if (customOnes.length > 0) {
    parts.push(`\n## 命定之人`);
    customOnes.forEach((one, idx) => {
      parts.push(`\n### ${idx + 1}. ${one.name}`);
      parts.push(`- 种族：${one.race}`);
      parts.push(`- 身份：${one.identity.join('、')}`);
      if (one.career.length > 0) parts.push(`- 职业：${one.career.join('、')}`);
      parts.push(`- 生命层级：${one.lifeLevel}`);
      parts.push(`- 等级：${one.level}`);
      parts.push(`- 性格：${one.personality}`);
      parts.push(`- 喜爱：${one.like}`);
      parts.push(`- 外貌：${one.app}`);
      parts.push(`- 衣着：${one.cloth}`);

      if (one.equip.length > 0) {
        parts.push(`- 装备：`);
        one.equip.forEach(eq => {
          if (eq.name) parts.push(`  - ${eq.name}${eq.description ? `：${eq.description}` : ''}`);
        });
      }

      parts.push(
        `- 属性：力量${one.attributes.strength} 敏捷${one.attributes.dexterity} 体质${one.attributes.constitution} 智力${one.attributes.intelligence} 精神${one.attributes.mind}`,
      );

      if (one.stairway.isOpen) {
        parts.push(`- 登神长阶：已开启`);
        // 如果有登神长阶的描述信息，也一并发送
        if (one.stairway.elements?.描述) {
          parts.push(`  - 描述：${one.stairway.elements.描述}`);
        }
      }
      parts.push(`- 是否缔结契约：${one.isContract}`);
      parts.push(`- 好感度：${one.affinity}`);
      if (one.comment) parts.push(`- 评价：${one.comment}`);
      if (one.backgroundInfo) parts.push(`- 背景：${one.backgroundInfo}`);

      if (one.skills.length > 0) {
        parts.push(`- 技能：`);
        one.skills.forEach(sk => parts.push(`  - ${sk.name}：${sk.effect}`));
      }
    });
  }

  // 初始开局
  if (background) {
    parts.push(`\n## 初始开局剧情`);
    parts.push(`### ${background.name}`);
    if (background.requiredRace) parts.push(`- 种族限制：${background.requiredRace}`);
    if (background.requiredLocation) parts.push(`- 地点限制：${background.requiredLocation}`);
    parts.push(`\n${background.description}`);
  }

  // 添加 AI 生成指令
  parts.push(`\n---\n`);
  parts.push(`务必按照<status_current_variables>和以上内容，生成一个符合描述和情景的初始剧情！\n`);
  parts.push(`<NOTICE: 已在<status_current_variables>内的数据，不得修改和删除>\n`);
  parts.push(
    `(注意：生成初始剧情时，还需根据内容，将相关数据在<UpdateVariable>内进行记录和更新，严禁任何修改和省略。同时检查上述内容是否完整，如不完整，参必须考相关设定进行完善)`,
  );

  return parts.join('\n');
}
