/**
 * MVU 变量框架完整类型声明
 * 此文件包含 MVU 的完整类型定义，由项目维护者手动维护
 * 基于 https://github.com/MagicalAstrogy/MagVarUpdate/blob/master/src/export_globals.ts
 */

// ============================================================================
// 命令类型定义
// ============================================================================

type CommandNames = 'set' | 'insert' | 'delete' | 'add';

/**
 * 对 parseMessage / updateVariables 内部命令解析结果的补充类型说明。
 *
 * 每个字符串元素都是在原始指令中截取的字面量或表达式片段，尚未经过 `parseCommandValue` 解析。
 */
type SetCommandArgs =
  | [path: string, newValueLiteral: string]
  | [path: string, expectedOldValueLiteral: string, newValueLiteral: string];

/**
 * `_.assign` 与 `_.insert` 支持两种形态：直接追加值，或在指定键/索引处写入。
 */
type AssignCommandArgs =
  | [path: string, valueLiteral: string]
  | [path: string, indexOrKeyLiteral: string, valueLiteral: string];

/**
 * 删除指令既可以直接给出完整路径，也可以通过第二个参数指定要移除的索引/键或匹配值。
 */
type RemoveCommandArgs = [path: string] | [path: string, indexKeyOrValueLiteral: string];

/**
 * `_.add` 始终需要增量或布尔目标，用第二个参数表示。
 */
type AddCommandArgs = [path: string, deltaOrToggleLiteral: string];

type CommandArgsMap = {
  set: SetCommandArgs;
  insert: AssignCommandArgs;
  delete: RemoveCommandArgs;
  add: AddCommandArgs;
};

// ============================================================================
// Mvu 命名空间类型定义
// ============================================================================

declare namespace Mvu {
  /**
   * MVU 数据结构
   */
  interface MvuData {
    /** 已被 mvu 初始化 initvar 条目的世界书列表 */
    initialized_lorebooks: string[];

    /** 实际的变量数据 */
    stat_data: Record<string, any>;

    /** 用于显示的数据，包含变化描述 */
    display_data?: Record<string, any>;

    /** 仅包含本次更新变化的数据 */
    delta_data?: Record<string, any>;
  }

  /**
   * 更新上下文，用于 BEFORE_MESSAGE_UPDATE 事件
   */
  interface UpdateContext {
    /** 当前轮次更新完成时的变量状态 */
    variables: MvuData;
    /** 最初对应于此次变量更新的消息内容，对齐进行更改可以影响最终输出的内容 */
    message_content: string;
  }

  /**
   * CommandInfo 与内部的 Command 结构保持字段布局一致，
   * 但针对不同命令给出了更精确的参数元组形态，方便在外部做类型推断或文档查看。
   */
  type CommandInfo = {
    [K in CommandNames]: {
      type: K;
      full_match: string;
      args: CommandArgsMap[K];
      reason: string;
    };
  }[CommandNames];

  type SetCommandInfo = {
    type: 'set';
    full_match: string;
    args:
      | [path: string, new_value_literal: string]
      | [path: string, expected_old_value_literal: string, new_value_literal: string];
    reason: string;
  };

  type InsertCommandInfo = {
    type: 'insert';
    full_match: string;
    args:
      | [path: string, value_literal: string]
      | [path: string, index_or_key_literal: string, value_literal: string];
    reason: string;
  };

  type DeleteCommandInfo = {
    type: 'delete';
    full_match: string;
    args: [path: string] | [path: string, index_or_key_or_value_literal: string];
    reason: string;
  };

  type AddCommandInfo = {
    type: 'add';
    full_match: string;
    args: [path: string, delta_or_toggle_literal: string];
    reason: string;
  };

  /**
   * 变量事件常量集合
   */
  interface VariableEvents {
    /**
     * 单个变量更新时触发的事件
     * - 事件值: 'mag_variable_updated'
     * - 回调签名: (stat_data: Record<string, any>, path: string, oldValue: any, newValue: any) => void
     *   - stat_data: 完整的状态数据对象
     *   - path: 被更新的变量路径（如 'player.health' 或 'items[0].name'）
     *   - oldValue: 更新前的值
     *   - newValue: 更新后的新值
     * - 触发条件: 当通过 setMvuVariable / _.set 语句更新一个变量之后， 会触发这个事件
     */
    SINGLE_VARIABLE_UPDATED: 'mag_variable_updated';

    /**
     * 批量变量更新开始时触发的事件
     * - 事件值: 'mag_variable_update_started'
     * - 回调签名: (variables: MvuData, out_is_updated: boolean) => void
     * - 触发时机: parseMessage 或 LLM消息回复结束 开始解析命令之前
     */
    VARIABLE_UPDATE_STARTED: 'mag_variable_update_started';

    /**
     * 批量变量更新结束时触发的事件
     * - 事件值: 'mag_variable_update_ended'
     * - 回调签名: (variables: MvuData, out_is_updated: boolean) => void
     * - 触发时机: parseMessage 或 LLM消息回复结束 完成所有命令的处理后
     */
    VARIABLE_UPDATE_ENDED: 'mag_variable_update_ended';

    /**
     * 在进行 0 层消息初始化时会触发的事件
     * - 事件值: 'mag_variable_initialized'
     * - 回调签名: (variables: Record<string, any> & MvuData, swipe_id: number) => void
     * - 触发时机: 在进行 0 层的变量初始化时，对每一个开场白(swipe) 都会调用一次
     */
    VARIABLE_INITIALIZED: 'mag_variable_initialized';

    /**
     * 解析完指令后，开始处理之前触发的事件
     * - 事件值: 'mag_command_parsed'
     * - 回调签名: (variables: MvuData, commands: CommandInfo[], message_content: string) => void
     * - 触发时机: 解析完指令后，开始处理之前
     */
    COMMAND_PARSED: 'mag_command_parsed';

    /**
     * 在 MVU 即将对楼层变量进行更新的场合触发的事件
     * - 事件值: 'mag_before_message_update'
     * - 回调签名: (context: UpdateContext) => void
     * - 触发时机: 完成变量更新操作，即将插入 <StatusPlaceHolderImpl/> 前
     */
    BEFORE_MESSAGE_UPDATE: 'mag_before_message_update';
  }
}

// ============================================================================
// Mvu 全局对象类型定义
// ============================================================================

/**
 * mvu 变量框架脚本提供的额外功能
 * 必须额外安装 mvu 变量框架脚本
 * 具体内容见于 https://github.com/MagicalAstrogy/MagVarUpdate/blob/master/src/export_globals.ts
 *
 * **在使用它之前, 你应该先通过 `await waitGlobalInitialized('Mvu')` 来等待 Mvu 初始化完毕**
 * 你也可以在酒馆页面按 f12, 在控制台中输入 `window.Mvu` 来查看当前 Mvu 变量框架所提供的接口
 */
declare const Mvu: {
  /**
   * 变量事件常量集合
   * 包含核心事件，用于监听和响应变量系统的不同更新阶段
   *
   * @example
   * // 1. 监听单个变量更新 - 实现变量联动
   * eventOn(Mvu.events.SINGLE_VARIABLE_UPDATED, (stat_data, path, oldValue, newValue) => {
   *   console.log(`[变量更新] ${path}: ${oldValue} -> ${newValue}`);
   *
   *   // 等级提升时的连锁反应
   *   if (path === 'player.level' && newValue > oldValue) {
   *     const levelUp = newValue - oldValue;
   *     const newMaxHealth = stat_data.player.maxHealth + (levelUp * 10);
   *     Mvu.setMvuVariable(stat_data, 'player.maxHealth', newMaxHealth, {
   *       reason: `升级奖励(+${levelUp}级)`
   *     });
   *   }
   * });
   *
   * // 2. 监听批量更新开始 - 准备UI和状态
   * var value_snapshot = undefined;
   * eventOn(Mvu.events.VARIABLE_UPDATE_STARTED, (variables, out_is_updated) => {
   *   value_snapshot = variables.stat_data.世界线变更度;
   * });
   *
   * // 3. 监听批量更新结束 - 完成后处理
   * eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (variables, out_is_updated) => {
   *   Mvu.setMvuVariable(variables.stat_data, '世界线变更都', value_snapshot);
   * });
   */
  events: {
    SINGLE_VARIABLE_UPDATED: 'mag_variable_updated';
    VARIABLE_UPDATE_STARTED: 'mag_variable_update_started';
    VARIABLE_UPDATE_ENDED: 'mag_variable_update_ended';
    VARIABLE_INITIALIZED: 'mag_variable_initialized';
    COMMAND_PARSED: 'mag_command_parsed';
    BEFORE_MESSAGE_UPDATE: 'mag_before_message_update';
  };

  /**
   * 解析包含变量更新命令的消息
   * @param message - 包含 _.set() 命令的消息字符串
   * @param old_data - 当前的 MvuData 状态
   * @returns 如果有变量被更新则返回新的 MvuData，否则返回 undefined
   * @example
   * const newData = await Mvu.parseMessage(`
   *   _.set('player.health', 100, 80);//受到伤害
   *   _.set('player.position', "城镇", "森林");//移动
   * `, currentData);
   */
  parseMessage: (message: string, old_data: Mvu.MvuData) => Promise<Mvu.MvuData | undefined>;

  /**
   * 获取指定作用域的 MvuData
   * @param options - 变量选项，指定获取哪个作用域的变量（chat/message/global等）
   * @returns MvuData 对象
   * @example
   * const chatData = Mvu.getMvuData({ type: 'chat' });
   * const messageData = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
   */
  getMvuData: (options: VariableOption) => Mvu.MvuData;

  /**
   * 替换指定作用域的 MvuData
   * @param mvu_data - 要设置的新 MvuData
   * @param options - 变量选项，指定替换哪个作用域的变量
   * @example
   * await Mvu.replaceMvuData(newData, { type: 'chat' });
   */
  replaceMvuData: (mvu_data: Mvu.MvuData, options: VariableOption) => Promise<void>;

  /**
   * 获取当前消息的 MvuData
   * @returns 当前消息的 MvuData 对象
   * @example
   * const currentData = Mvu.getCurrentMvuData();
   */
  getCurrentMvuData: () => Mvu.MvuData;

  /**
   * 替换当前消息的 MvuData
   * @param mvu_data - 要设置的新 MvuData
   * @example
   * await Mvu.replaceCurrentMvuData(updatedData);
   */
  replaceCurrentMvuData: (mvu_data: Mvu.MvuData) => Promise<void>;

  /**
   * 重新加载初始变量数据
   * @param mvu_data - 要重新加载初始数据的 MvuData 对象
   * @returns 是否加载成功
   * @example
   * const success = await Mvu.reloadInitVar(mvuData);
   */
  reloadInitVar: (mvu_data: Mvu.MvuData) => Promise<boolean>;

  /**
   * 设置单个变量的值
   * @param mvu_data - 要更新的 MvuData 对象
   * @param path - 变量路径，支持嵌套路径如 "player.health" 或数组索引 "items[0]"
   * @param new_value - 新值
   * @param options - 可选参数
   * @param options.reason - 更新原因，会显示在 display_data 中
   * @param options.is_recursive - 是否触发 mag_variable_updated 事件，默认 false
   * @returns 更新是否成功
   * @example
   * // 简单更新
   * await Mvu.setMvuVariable(data, 'player.health', 80);
   *
   * // 带原因的更新
   * await Mvu.setMvuVariable(data, 'player.health', 80, { reason: '受到伤害' });
   *
   * // 触发事件的更新
   * await Mvu.setMvuVariable(data, 'player.level', 2, {
   *   reason: '升级',
   *   is_recursive: true
   * });
   */
  setMvuVariable: (
    mvu_data: Mvu.MvuData,
    path: string,
    new_value: any,
    options?: { reason?: string; is_recursive?: boolean },
  ) => Promise<boolean>;

  /**
   * 获取变量的值
   * @param mvu_data - MvuData 对象
   * @param path - 变量路径，支持嵌套路径
   * @param options - 可选参数
   * @param options.category - 从哪个数据类别获取：'stat'(默认)/'display'/'delta'
   * @param options.default_value - 当路径不存在时返回的默认值
   * @returns 变量值。如果是 ValueWithDescription 类型，返回第一个元素（实际值）
   * @example
   * // 获取 stat_data 中的值
   * const health = Mvu.getMvuVariable(data, 'player.health');
   *
   * // 获取 display_data 中的显示值
   * const healthDisplay = Mvu.getMvuVariable(data, 'player.health', {
   *   category: 'display'
   * });
   *
   * // 带默认值
   * const score = Mvu.getMvuVariable(data, 'player.score', {
   *   default_value: 0
   * });
   */
  getMvuVariable: (
    mvu_data: Mvu.MvuData,
    path: string,
    options?: { category?: 'stat' | 'display' | 'delta'; default_value?: any },
  ) => any;

  /**
   * 获取指定类别的完整数据记录
   * @param mvu_data - MvuData 对象
   * @param category - 数据类别：'stat'/'display'/'delta'
   * @returns 对应类别的完整数据记录对象
   * @example
   * // 获取所有状态数据
   * const allStatData = Mvu.getRecordFromMvuData(data, 'stat');
   *
   * // 获取所有显示数据
   * const allDisplayData = Mvu.getRecordFromMvuData(data, 'display');
   *
   * // 获取所有增量数据
   * const allDeltaData = Mvu.getRecordFromMvuData(data, 'delta');
   *
   * @note 通常用于 LLM 准备 foreach 数据时使用
   */
  getRecordFromMvuData: (
    mvu_data: Mvu.MvuData,
    category: 'stat' | 'display' | 'delta',
  ) => Record<string, any>;
};

// ============================================================================
// MVU 类型别名（用于兼容性）
// ============================================================================

type MVU = typeof Mvu;

// ============================================================================
// ListenerType 扩展（事件监听器类型）
// ============================================================================

interface ListenerType {
  /**
   * 单个变量更新时触发
   * @param stat_data - 完整的状态数据对象
   * @param path - 被更新的变量路径（如 'player.health' 或 'items[0].name'）
   * @param oldValue - 更新前的值
   * @param newValue - 更新后的新值
   */
  mag_variable_updated: (
    stat_data: Record<string, any>,
    path: string,
    oldValue: any,
    newValue: any,
  ) => void;

  /** 变量初始化时触发 */
  [Mvu.events.VARIABLE_INITIALIZED]: (variables: Mvu.MvuData, swipe_id: number) => void;

  /** 即将用更新后的变量更新楼层时触发 */
  [Mvu.events.BEFORE_MESSAGE_UPDATE]: (context: Mvu.UpdateContext) => void;

  /** 变量更新开始时触发 */
  [Mvu.events.VARIABLE_UPDATE_STARTED]: (variables: Mvu.MvuData) => void;

  /** 命令解析完成时触发 */
  [Mvu.events.COMMAND_PARSED]: (
    variables: Mvu.MvuData,
    commands: Mvu.CommandInfo[],
    message_content: string,
  ) => void;

  /** 变量更新结束时触发 */
  [Mvu.events.VARIABLE_UPDATE_ENDED]: (
    variables: Mvu.MvuData,
    variables_before_update: Mvu.MvuData,
  ) => void;
}
