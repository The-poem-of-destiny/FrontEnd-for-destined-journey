/**
 * 限制数值范围
 * @param {number} val - 默认数值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 */
export const clampedMum = (val: number, min: number, max: number) =>
  z.coerce
    .number()
    .prefault(val)
    .transform(val => _.clamp(val, min, max));

/**
 * 数字取整并限制最小值
 * @param {number} val - 默认数值
 * @param {number} min - 最小值
 */
export const minLimitedNum = (val: number, min: number) =>
  z.coerce
    .number()
    .prefault(val)
    .transform(val => Math.max(Math.round(val), min));

/**
 * 截取 record 的前 n 个条目
 * @param {Record<string, T>} record - 待截取的 record
 * @param {number} limit - 限制的条目数
 */
const sliceRecord = <T>(record: Record<string, T>, limit: number): Record<string, T> =>
  _.fromPairs(_.take(_.toPairs(record), limit));

/**
 * 任务 schema
 */
export const TaskSchema = z
  .object({
    简介: z.string().prefault(''),
    目标: z.string().prefault(''),
    奖励: z.string().prefault(''),
  })
  .prefault({});

/**
 * 货币 schema
 */
export const CurrencySchema = z
  .object({
    金币: z.coerce.number().prefault(0).transform(Math.round),
    银币: z.coerce.number().prefault(0).transform(Math.round),
    铜币: z.coerce.number().prefault(0).transform(Math.round),
  })
  .prefault({});

/**
 * 基础物品 schema
 */
export const BaseItemSchema = z.object({
  品质: z.string().prefault(''),
  类型: z.string().prefault(''),
  标签: z.array(z.string()).prefault([]).optional(),
  效果: z.record(z.string(), z.string()).prefault({}),
  描述: z.string().prefault(''),
});

/**
 * 装备schema
 */
export const EquipmentSchema = BaseItemSchema.extend({
  位置: z.string().prefault(''),
});

/**
 * 技能 schema
 */
export const SkillSchema = BaseItemSchema.extend({
  消耗: z.string().prefault(''),
}).transform(data => _.pick(data, ['品质', '类型', '消耗', '标签', '效果', '描述']));

/**
 * 状态效果 schema (增益/减益/特殊效果)
 */
export const StatusEffectSchema = z
  .object({
    类型: z.enum(['增益', '减益', '特殊']).prefault('增益'),
    效果: z.string().prefault(''),
    层数: z.coerce.number().prefault(1),
    剩余时间: z.string().prefault(''),
    来源: z.string().prefault(''),
  })
  .prefault({});

/**
 * 背包物品 schema
 */
export const InventoryItemSchema = BaseItemSchema.extend({
  数量: z.coerce.number().prefault(1),
}).transform(data => _.pick(data, ['品质', '类型', '数量', '标签', '效果', '描述']));

/**
 * 基础属性 schema
 */
const DefaultAttr = {
  力量: 0,
  敏捷: 0,
  体质: 0,
  智力: 0,
  精神: 0,
} as const;

export const BaseAttrSchema = z
  .object(_.mapValues(DefaultAttr, () => z.coerce.number().prefault(0)))
  .prefault({});

/**
 * 登神长阶 schema
 *
 * 进阶逻辑（递归关系）：
 * - 3要素 → 合成1权能（清空要素）
 * - 2权能 → 合成1法则（清空权能）
 *
 * 状态约束：
 * - 有法则时：权能和要素永久清空，不可再获得
 * - 权能满2个时：要素清空，不可再获得
 * - 正常情况（权能<2 且 无法则）：可收集要素（最多3个）
 */
export const AscensionSchema = z
  .object({
    是否开启: z.boolean().prefault(false),
    要素: z.record(z.string(), z.record(z.string(), z.string())).prefault({}),
    权能: z.record(z.string(), z.record(z.string(), z.string())).prefault({}),
    法则: z.record(z.string(), z.record(z.string(), z.string())).prefault({}),
    神位: z.string().prefault(''),
    神国: z
      .object({
        名称: z.string().prefault(''),
        描述: z.string().prefault(''),
      })
      .prefault({}),
  })
  .prefault({})
  .transform(data => {
    const LawNum = _.size(data.法则);
    const powerNum = _.size(data.权能);
    const powerLimit = 2;
    const eleLimit = 3;

    // 有法则：权能和要素永久清空
    if (LawNum > 0) {
      return {
        ...data,
        要素: {},
        权能: {},
        法则: data.神位 ? data.法则 : sliceRecord(data.法则, 1),
      };
    }

    // 权能满上限：要素清空
    if (powerNum >= powerLimit) {
      return {
        ...data,
        要素: {},
        权能: sliceRecord(data.权能, powerLimit),
        法则: sliceRecord(data.法则, 1),
      };
    }

    // 无权能且无法则：正常收集要素
    return {
      ...data,
      要素: sliceRecord(data.要素, eleLimit),
      权能: sliceRecord(data.权能, powerLimit),
      法则: {},
    };
  });

/**
 * 通用角色身份信息 schema
 */
export const IdentitySchema = z.object({
  等级: clampedMum(1, 1, 25),
  生命层级: z.string().prefault(''),
  种族: z.string().prefault(''),
  身份: z.array(z.string()).prefault([]),
  职业: z.array(z.string()).prefault([]),
  属性: BaseAttrSchema,
  装备: z.record(z.string(), EquipmentSchema).prefault({}),
  技能: z.record(z.string(), SkillSchema).prefault({}),
  登神长阶: AscensionSchema,
});
