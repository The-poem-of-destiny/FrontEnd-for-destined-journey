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
  世界: z
    .object({
      时间: z.string().prefault(''),
      地点: z.string().prefault(''),
    })
    .prefault({}),
  事件链: z
    .object({
      开启: z.boolean().prefault(false),
      结束: z.boolean().prefault(false),
      琥珀事件: z.boolean().prefault(false),
      标题: z.any().prefault(''),
      阶段: z.any().prefault(''),
      已完成事件: z.array(z.any()).prefault([]),
    })
    .prefault({}),
  任务列表: z.record(z.string(), QuestSchema).prefault({}),
  角色: z
    .object({
      种族: z.string().prefault(''),
      身份: z.array(z.string()).prefault([]),
      职业: z.array(z.string()).prefault([]),
      生命层级: z.string().prefault('第一层级/普通层级'),
      等级: clampedNum(1, 1, 25),
      累计经验值: z.coerce.number().prefault(0),
      升级所需经验: z.union([z.coerce.number().prefault(120), z.string().prefault('MAX')]),
      冒险者等级: z.string().prefault('未评级'),
      生命值上限: z.coerce.number().prefault(0),
      生命值: z.coerce.number().prefault(0),
      法力值上限: z.coerce.number().prefault(0),
      法力值: z.coerce.number().prefault(0),
      体力值上限: z.coerce.number().prefault(0),
      体力值: z.coerce.number().prefault(0),
      属性: CharacterAttributeSchema.prefault({}),
      技能列表: z.record(z.string(), SkillSchema).prefault({}),
    })
    .prefault({})
    .transform(data => ({
      ...data,
      升级所需经验: data.等级 >= 25 ? 'MAX' : data.升级所需经验,
      生命值: _.clamp(data.生命值, 0, data.生命值上限),
      法力值: _.clamp(data.法力值, 0, data.法力值上限),
      体力值: _.clamp(data.体力值, 0, data.体力值上限),
    })),
  背包: z
    .record(z.string(), InventoryItemSchema)
    .prefault({})
    .transform(items => _.pickBy(items, item => item.数量 > 0)),
  货币: z
    .object({
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
    })
    .prefault({}),
  装备: z
    .object({
      武器: z.record(z.string(), EquipmentSchema).prefault({}),
      防具: z.record(z.string(), EquipmentSchema).prefault({}),
      饰品: z.record(z.string(), EquipmentSchema).prefault({}),
    })
    .prefault({}),
  登神长阶: AscensionSchema,
  命定系统: z
    .object({
      命运点数: z.coerce
        .number()
        .prefault(0)
        .transform(val => Math.floor(Math.max(val, 0))),
      命定之人: z
        .record(
          z.string(),
          z.object({
            是否在场: coercedBoolean(true),
            生命层级: z.string().prefault(''),
            等级: clampedNum(1, 1, 25),
            种族: z.string().prefault(''),
            身份: z.array(z.string()).prefault([]),
            职业: z.array(z.string()).prefault([]),
            性格: z.string().prefault(''),
            喜爱: z.string().prefault(''),
            外貌特质: z.string().prefault(''),
            衣物装饰: z.string().prefault(''),
            装备: z.record(z.string(), DestinedEquipmentSchema).prefault({}),
            属性: BaseAttributeSchema,
            登神长阶: AscensionSchema,
            是否缔结契约: coercedBoolean(false),
            好感度: clampedNum(0, -100, 100),
            评价: z.string().prefault(''),
            背景故事: z.string().prefault(''),
            技能: z.record(z.string(), SkillSchema).prefault({}),
          }),
        )
        .prefault({}),
    })
    .prefault({}),
  新闻: z
    .object({
      阿斯塔利亚快讯: z
        .object({
          势力要闻: z.string().prefault(''),
          尊位行迹: z.string().prefault(''),
          军事行动: z.string().prefault(''),
          经济动脉: z.string().prefault(''),
          灾害预警: z.string().prefault(''),
        })
        .prefault({}),
      酒馆留言板: z
        .object({
          高额悬赏: z.string().prefault(''),
          冒险发现: z.string().prefault(''),
          怪物异动: z.string().prefault(''),
          通缉要犯: z.string().prefault(''),
          宝物传闻: z.string().prefault(''),
        })
        .prefault({}),
      午后茶会: z
        .object({
          社交逸闻: z.string().prefault(''),
          千里远望: z.string().prefault(''),
          命运涟漪: z.string().prefault(''),
          邂逅预兆: z.string().prefault(''),
        })
        .prefault({}),
    })
    .prefault({}),
});
