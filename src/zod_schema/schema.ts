import {
  AscensionSchema,
  BaseAttributeSchema,
  CharacterAttributeSchema,
  clampedNum,
  coercedBoolean,
  DestinedEquipmentSchema,
  EquipmentSchema,
  InventoryItemSchema,
  QuestSchema,
  SkillSchema,
} from './utils.ts';

export const Schema = z.object({
  世界: z.object({
    时间: z.string(),
    地点: z.string(),
  }),
  事件链: z.object({
    开启: z.boolean().prefault(false),
    结束: z.boolean().prefault(false),
    琥珀事件: z.boolean().prefault(false),
    标题: z.any(),
    阶段: z.any(),
    已完成事件: z.array(z.any()),
  }),
  任务列表: z.record(z.string(), QuestSchema),
  角色: z
    .object({
      种族: z.string(),
      身份: z.array(z.string()),
      职业: z.array(z.string()),
      生命层级: z.string().prefault('第一层级/普通层级'),
      等级: clampedNum(1, 1, 25),
      累计经验值: z.coerce.number(),
      升级所需经验: z.coerce.number().prefault(23),
      冒险者等级: z.string().prefault('未评级'),
      生命值上限: z.coerce.number(),
      生命值: z.coerce.number(),
      法力值上限: z.coerce.number(),
      法力值: z.coerce.number(),
      体力值上限: z.coerce.number(),
      体力值: z.coerce.number(),
      属性: CharacterAttributeSchema,
      技能列表: z.record(z.string(), SkillSchema),
    })
    .transform(data => ({
      ...data,
      升级所需经验: data.等级 >= 25 ? 'MAX' : data.升级所需经验,
      生命值: _.clamp(data.生命值, 0, data.生命值上限),
      法力值: _.clamp(data.法力值, 0, data.法力值上限),
      体力值: _.clamp(data.体力值, 0, data.体力值上限),
    })),
  背包: z
    .record(z.string(), InventoryItemSchema)
    .transform(items =>
      Object.fromEntries(Object.entries(items).filter(([, item]) => item.数量 > 0)),
    ),
  货币: z.object({
    金币: z.coerce
      .number()
      .prefault(0)
      .transform(val => Math.floor(Math.max(val, 0))),
    银币: z.coerce
      .number()
      .prefault(0)
      .transform(val => Math.floor(Math.max(val, 0))),
    铜币: z.coerce
      .number()
      .prefault(0)
      .transform(val => Math.floor(val)),
  }),
  装备: z.object({
    武器: z.record(z.string(), EquipmentSchema),
    防具: z.record(z.string(), EquipmentSchema),
    饰品: z.record(z.string(), EquipmentSchema),
  }),
  登神长阶: AscensionSchema,
  命定系统: z.object({
    命运点数: z.coerce.number().transform(val => Math.floor(Math.max(val, 0))),
    命定之人: z.record(
      z.string(),
      z.object({
        是否在场: coercedBoolean(true),
        生命层级: z.string(),
        等级: clampedNum(1, 1, 25),
        种族: z.string(),
        身份: z.array(z.string()),
        职业: z.array(z.string()),
        性格: z.string(),
        喜爱: z.string(),
        外貌特质: z.string(),
        衣物装饰: z.string(),
        装备: z.record(z.string(), DestinedEquipmentSchema),
        属性: BaseAttributeSchema,
        登神长阶: AscensionSchema,
        是否缔结契约: coercedBoolean(false),
        好感度: clampedNum(0, -100, 100),
        评价: z.string(),
        背景故事: z.string(),
        技能: z.record(z.string(), SkillSchema),
      }),
    ),
  }),
  新闻: z.object({
    阿斯塔利亚快讯: z.object({
      势力要闻: z.string(),
      尊位行迹: z.string(),
      军事行动: z.string(),
      经济动脉: z.string(),
      灾害预警: z.string(),
    }),
    酒馆留言板: z.object({
      高额悬赏: z.string(),
      冒险发现: z.string(),
      怪物异动: z.string(),
      通缉要犯: z.string(),
      宝物传闻: z.string(),
    }),
    午后茶会: z.object({
      社交逸闻: z.string(),
      千里远望: z.string(),
      命运涟漪: z.string(),
      邂逅预兆: z.string(),
    }),
  }),
});
