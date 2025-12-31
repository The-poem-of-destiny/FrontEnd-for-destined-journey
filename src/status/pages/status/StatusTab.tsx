import { FC, ReactNode, useState } from 'react';
import { useEditorSettingStore, useMvuDataStore } from '../../core/stores';
import {
  Ascension,
  Card,
  Collapse,
  ConfirmModal,
  EditableField,
  EmptyHint,
  ResourceBar,
} from '../../shared/components';
import { SelectEditorOption } from '../../shared/components/editors';
import { withMvuData, WithMvuDataProps } from '../../shared/hoc';
import styles from './StatusTab.module.scss';

/** 字段类型 */
type FieldType = 'text' | 'number' | 'tags' | 'select';

/** 基础信息字段配置 */
interface BasicInfoFieldConfig {
  key: string;
  label: string;
  type: FieldType;
  editable: boolean;
  defaultValue: string | number | string[];
  prefix?: string;
}

// 基础信息字段
const BasicInfoFields: BasicInfoFieldConfig[] = [
  { key: '种族', label: '种族', type: 'text', editable: true, defaultValue: '未知' },
  { key: '职业', label: '职业', type: 'tags', editable: true, defaultValue: [] },
  { key: '身份', label: '身份', type: 'tags', editable: true, defaultValue: [] },
  { key: '生命层级', label: '生命层级', type: 'text', editable: false, defaultValue: '第一层级' },
  { key: '等级', label: '等级', type: 'number', editable: false, defaultValue: 1, prefix: 'Lv.' },
  { key: '冒险者等级', label: '冒险者等级', type: 'text', editable: true, defaultValue: '未评级' },
];

// 资源条配置
const ResourceFields = [
  { label: 'HP', currentKey: '生命值', maxKey: '生命值上限', type: 'hp' as const },
  { label: 'MP', currentKey: '法力值', maxKey: '法力值上限', type: 'mp' as const },
  { label: 'SP', currentKey: '体力值', maxKey: '体力值上限', type: 'sp' as const },
] as const;

// 状态效果类型选项
const StatusEffectTypeOptions: SelectEditorOption[] = [
  { label: '增益', value: '增益' },
  { label: '减益', value: '减益' },
  { label: '特殊', value: '特殊' },
];

const renderCollapseTitle = (label: string, summary: string): ReactNode => (
  <div className={styles.collapseTitleRow}>
    <span>{label}</span>
    <span className={styles.collapseSummary}>{summary}</span>
  </div>
);

interface StatusEffectsProps {
  effects: Record<
    string,
    { 类型?: string; 效果?: string; 层数?: number; 剩余时间?: string; 来源?: string }
  >;
  summary: string;
  editEnabled: boolean;
  onDelete: (name: string) => void;
}

const StatusEffects: FC<StatusEffectsProps> = ({ effects, summary, editEnabled, onDelete }) => {
  return (
    <Collapse title={renderCollapseTitle('状态效果', summary)} className={styles.statusTabCard}>
      <div className={styles.statusEffects}>
        {_.isEmpty(effects) ? (
          <EmptyHint className={styles.emptyEffects} text="暂无状态效果" />
        ) : (
          _.map(effects, (effect, name) => {
            const typeClass =
              effect.类型 === '增益'
                ? styles.effectBuff
                : effect.类型 === '减益'
                  ? styles.effectDebuff
                  : styles.effectSpecial;

            return (
              <div
                key={name}
                className={`${styles.effectItem} ${typeClass} ${editEnabled ? styles.effectItemEdit : ''}`}
              >
                {/* 左侧：名称和核心信息 */}
                <div className={styles.effectInfo}>
                  <div className={styles.effectHeader}>
                    <span className={styles.effectName}>{name}</span>
                    {editEnabled ? (
                      <EditableField
                        path={`主角.状态效果.${name}.类型`}
                        value={effect.类型 ?? '增益'}
                        type="select"
                        label="类型"
                        selectConfig={{ options: StatusEffectTypeOptions }}
                      />
                    ) : (
                      effect.类型 && <span className={styles.effectType}>{effect.类型}</span>
                    )}
                  </div>
                  {editEnabled ? (
                    <div className={styles.effectEditRow}>
                      <span className={styles.effectEditLabel}>效果</span>
                      <EditableField
                        path={`主角.状态效果.${name}.效果`}
                        value={effect.效果 ?? ''}
                        type="text"
                        label="效果"
                      />
                    </div>
                  ) : (
                    effect.效果 && <span className={styles.effectDesc}>{effect.效果}</span>
                  )}
                  {editEnabled ? (
                    <div className={styles.effectEditRow}>
                      <span className={styles.effectEditLabel}>来源</span>
                      <EditableField
                        path={`主角.状态效果.${name}.来源`}
                        value={effect.来源 ?? ''}
                        type="text"
                        label="来源"
                      />
                    </div>
                  ) : (
                    effect.来源 && <span className={styles.effectSource}>来源：{effect.来源}</span>
                  )}
                </div>
                {/* 右侧：数值信息和操作 */}
                <div className={styles.effectMeta}>
                  {editEnabled ? (
                    <>
                      <div className={styles.effectMetaItem}>
                        <span className={styles.effectMetaLabel}>层数</span>
                        <EditableField
                          path={`主角.状态效果.${name}.层数`}
                          value={effect.层数 ?? 1}
                          type="number"
                          label="层数"
                          numberConfig={{ min: 1, step: 1 }}
                        />
                      </div>
                      <div className={styles.effectMetaItem}>
                        <span className={styles.effectMetaLabel}>剩余时间</span>
                        <EditableField
                          path={`主角.状态效果.${name}.剩余时间`}
                          value={effect.剩余时间 ?? ''}
                          type="text"
                          label="剩余时间"
                        />
                      </div>
                      <button
                        className={styles.effectDeleteBtn}
                        onClick={() => onDelete(name)}
                        title="删除状态效果"
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </>
                  ) : (
                    <>
                      {_.isNumber(effect.层数) && effect.层数 > 1 && (
                        <span className={styles.effectStack}>x{effect.层数}</span>
                      )}
                      {effect.剩余时间 && (
                        <span className={styles.effectTime}>{effect.剩余时间}</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Collapse>
  );
};

/**
 * 状态页内容组件
 */
const StatusTabContent: FC<WithMvuDataProps> = ({ data }) => {
  const editEnabled = useEditorSettingStore(state => state.editEnabled);
  const { deleteField } = useMvuDataStore();
  const player = data.主角;

  // 删除确认状态
  const [deleteTarget, setDeleteTarget] = useState<{
    type: string;
    path: string;
    name: string;
  } | null>(null);

  /**
   * 格式化基础信息显示值
   */
  const formatDisplayValue = (field: BasicInfoFieldConfig) => {
    const value = _.get(player, field.key);

    if (field.type === 'tags' && _.isArray(value)) {
      return value.length > 0 ? value.join(' / ') : field.defaultValue;
    }

    const displayValue = value ?? field.defaultValue ?? '';
    return field.prefix ? `${field.prefix}${displayValue}` : displayValue;
  };

  /**
   * 渲染基础信息字段
   */
  const renderBasicInfoField = (field: BasicInfoFieldConfig) => {
    const value = _.get(player, field.key);
    const path = `主角.${field.key}`;

    // 非编辑模式下始终显示只读值
    if (!editEnabled || !field.editable) {
      return (
        <div key={field.key} className={styles.basicInfoRow}>
          <span className={styles.basicInfoLabel}>{field.label}</span>
          <span className={styles.basicInfoValue}>{formatDisplayValue(field)}</span>
        </div>
      );
    }

    // 编辑模式下显示编辑器
    return (
      <div key={field.key} className={styles.basicInfoRow}>
        <span className={styles.basicInfoLabel}>{field.label}</span>
        <EditableField
          path={path}
          value={value ?? field.defaultValue}
          type={field.type}
          label={field.label}
        />
      </div>
    );
  };

  /**
   * 渲染资源值（编辑模式下可调整当前值和上限）
   */
  const renderResourceField = (field: (typeof ResourceFields)[number]) => {
    const current = _.get(player, field.currentKey, 0);
    const max = _.get(player, field.maxKey, 0);

    if (!editEnabled) {
      return (
        <ResourceBar
          key={field.type}
          label={field.label}
          current={current}
          max={max}
          type={field.type}
        />
      );
    }

    return (
      <div key={field.type} className={styles.resourceEditRow}>
        <span className={styles.resourceLabel}>{field.label}</span>
        <div className={styles.resourceEditors}>
          <EditableField
            path={`主角.${field.currentKey}`}
            value={current}
            type="number"
            label={field.currentKey}
            numberConfig={{ min: 0, max: max, step: 1 }}
          />
          <span className={styles.resourceSeparator}>/</span>
          <EditableField
            path={`主角.${field.maxKey}`}
            value={max}
            type="number"
            label={field.maxKey}
            numberConfig={{ min: 0, step: 1 }}
          />
        </div>
      </div>
    );
  };

  const statusEffects = player.状态效果 ?? {};
  const effectEntries = Object.entries(statusEffects);
  const effectStats = {
    total: effectEntries.length,
    buff: effectEntries.filter(([, effect]) => effect.类型 === '增益').length,
    debuff: effectEntries.filter(([, effect]) => effect.类型 === '减益').length,
    special: effectEntries.filter(([, effect]) => effect.类型 === '特殊').length,
  };

  const ascension = player.登神长阶;
  const ascensionParts = [
    Object.keys(ascension?.要素 ?? {}).length
      ? `要素 ${Object.keys(ascension?.要素 ?? {}).length}`
      : '',
    Object.keys(ascension?.权能 ?? {}).length
      ? `权能 ${Object.keys(ascension?.权能 ?? {}).length}`
      : '',
    Object.keys(ascension?.法则 ?? {}).length
      ? `法则 ${Object.keys(ascension?.法则 ?? {}).length}`
      : '',
    ascension?.神位 ? `神位 ${ascension.神位}` : '',
    ascension?.神国?.名称 ? `神国 ${ascension.神国.名称}` : '',
  ];

  const ascensionSummary = ascension?.是否开启
    ? _.compact(ascensionParts).join(' · ') || '已开启'
    : '未开启';

  const statusEffectSummary = effectStats.total
    ? _.compact([
        `共 ${effectStats.total}`,
        effectStats.buff ? `Buff ${effectStats.buff}` : '',
        effectStats.debuff ? `DeBuff ${effectStats.debuff}` : '',
        effectStats.special ? `特殊 ${effectStats.special}` : '',
      ]).join(' · ')
    : '无效果';

  /** 处理删除操作 */
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteField(deleteTarget.path);
      toastr.success(`已删除「${deleteTarget.name}」`);
    } catch {
      toastr.error('删除失败');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className={styles.statusTab}>
      {/* 基础信息卡片 */}
      <Card title="基础信息" className={styles.statusTabCard}>
        <div className={styles.basicInfo}>
          {BasicInfoFields.map(field => renderBasicInfoField(field))}
        </div>
      </Card>

      {/* 属性卡片 */}
      <Card
        title={
          editEnabled ? (
            <div className={styles.attributesTitleEdit}>
              <span>可分配属性点:</span>
              <EditableField
                path="主角.属性点"
                value={player.属性点 ?? 0}
                type="number"
                label="属性点"
                numberConfig={{ min: 0, step: 1 }}
              />
            </div>
          ) : (
            `可分配属性点: ${player.属性点 ?? 0}`
          )
        }
        className={styles.statusTabCard}
      >
        <div className={`${styles.attributes} ${editEnabled ? styles.attributesEdit : ''}`}>
          {_.map(player.属性, (value, key) => (
            <div
              key={key}
              className={`${styles.attributesItem} ${editEnabled ? styles.attributesItemEdit : ''}`}
            >
              <span className={styles.attributesLabel}>{key}</span>
              {editEnabled ? (
                <EditableField
                  path={`主角.属性.${key}`}
                  value={value ?? 0}
                  type="number"
                  label={key}
                  numberConfig={{ min: 0, max: 20, step: 1 }}
                />
              ) : (
                <span className={styles.attributesValue}>{value}</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 资源条卡片 */}
      <Card title="资源" className={styles.statusTabCard}>
        <div className={styles.resources}>
          {editEnabled ? (
            <>
              {ResourceFields.map(field => renderResourceField(field))}
              {/* 经验值编辑 */}
              <div className={styles.resourceEditRow}>
                <span className={styles.resourceLabel}>EXP</span>
                <div className={styles.resourceEditors}>
                  <EditableField
                    path="主角.累计经验值"
                    value={player.累计经验值 ?? 0}
                    type="number"
                    label="累计经验值"
                    numberConfig={{
                      min: 0,
                      // 如果升级所需经验是数字，则最大为 升级所需经验-1，否则不限制
                      max: _.isNumber(player.升级所需经验) ? player.升级所需经验 - 1 : undefined,
                      step: 1,
                    }}
                  />
                  <span className={styles.resourceSeparator}>/</span>
                  <span className={styles.expMax}>
                    {_.isNumber(player.升级所需经验) ? player.升级所需经验 : 'MAX'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {ResourceFields.map(field => (
                <ResourceBar
                  key={field.type}
                  label={field.label}
                  current={_.get(player, field.currentKey, 0)}
                  max={_.get(player, field.maxKey, 0)}
                  type={field.type}
                />
              ))}
              <ResourceBar
                label="EXP"
                current={player.累计经验值 ?? 0}
                max={_.isNumber(player.升级所需经验) ? player.升级所需经验 : 999}
                type="exp"
              />
            </>
          )}
        </div>
      </Card>

      {/* 状态效果卡片 */}
      <StatusEffects
        effects={statusEffects}
        summary={statusEffectSummary}
        editEnabled={editEnabled}
        onDelete={name =>
          setDeleteTarget({
            type: '状态效果',
            path: `主角.状态效果.${name}`,
            name,
          })
        }
      />

      {/* 登神长阶卡片 */}
      <Collapse
        title={renderCollapseTitle('登神长阶', ascensionSummary)}
        className={styles.statusTabCard}
      >
        <Ascension data={player.登神长阶} editEnabled={editEnabled} pathPrefix="主角.登神长阶" />
      </Collapse>

      {/* 删除确认弹窗 */}
      <ConfirmModal
        open={!!deleteTarget}
        title={`确认删除${deleteTarget?.type ?? ''}`}
        rows={[
          { label: '名称', value: deleteTarget?.name ?? '' },
          { label: '操作', value: '此操作不可撤销' },
        ]}
        buttons={[
          { text: '删除', variant: 'danger', onClick: handleDelete },
          { text: '取消', variant: 'secondary', onClick: () => setDeleteTarget(null) },
        ]}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

/**
 * 状态页组件（使用 HOC 包装）
 */
export const StatusTab = withMvuData({ baseClassName: styles.statusTab })(StatusTabContent);
