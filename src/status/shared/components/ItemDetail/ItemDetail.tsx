import { getQualityClass } from '@/status/core/utils';
import _ from 'lodash';
import { FC, ReactNode } from 'react';
import { EditableField } from '../EditableField';
import styles from './ItemDetail.module.scss';

/** 品质选项 */
const QUALITY_OPTIONS = [
  { value: '', label: '无' },
  { value: '普通', label: '普通' },
  { value: '优良', label: '优良' },
  { value: '稀有', label: '稀有' },
  { value: '史诗', label: '史诗' },
  { value: '传说', label: '传说' },
  { value: '神话', label: '神话' },
  { value: '唯一', label: '唯一' },
];

/** 物品详情的通用数据结构 */
export interface ItemData {
  品质?: string;
  类型?: string;
  标签?: string[];
  效果?: Record<string, string>;
  描述?: string;
  位置?: string;
  消耗?: string;
  数量?: number;
}

/** 物品类别 */
export type ItemCategory = 'equipment' | 'skill' | 'item';

/** 物品展示模式 */
export type ItemDetailDisplayMode = 'compact' | 'panel-card' | 'modal-detail';

interface ItemDetailProps {
  /** 物品名称 */
  name: string;
  /** 物品数据 */
  data: ItemData;
  /** 额外的标题元素（如数量、位置等） */
  titleSuffix?: ReactNode;
  /** 是否启用编辑模式 */
  editEnabled?: boolean;
  /** 数据路径前缀（用于编辑时构建完整路径） */
  pathPrefix?: string;
  /** 删除回调（点击删除按钮时触发，由父组件处理确认弹窗） */
  onDelete?: () => void;
  /** 物品类别，用于区分显示不同的字段 */
  itemCategory?: ItemCategory;
  /** 展示模式 */
  displayMode?: ItemDetailDisplayMode;
  /** 点击查看详情 */
  onInspect?: () => void;
}

/**
 * 物品详情组件
 * 用于渲染装备、技能、背包物品的摘要与完整信息。
 * 复用于 ItemsTab 和 DestinyTab。
 */
export const ItemDetail: FC<ItemDetailProps> = ({
  name,
  data,
  titleSuffix,
  editEnabled = false,
  pathPrefix,
  onDelete,
  itemCategory = 'item',
  displayMode = 'panel-card',
  onInspect,
}) => {
  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDelete?.();
  };

  const qualityClass = getQualityClass(data.品质, styles);
  const metaItems = [data.类型 ? { key: 'type', label: '类型', value: data.类型 } : null].filter(
    Boolean,
  ) as Array<{ key: string; label: string; value: string }>;

  const effectEntries = _.entries(data.效果 ?? {});
  const effectNames = effectEntries.map(([key]) => key);
  const summaryEffectNames = effectNames.slice(0, 4);

  const renderDeleteButton = () => {
    if (!editEnabled || !onDelete) return null;

    return (
      <button
        type="button"
        className={styles.deleteButton}
        onClick={handleDeleteClick}
        title="删除"
      >
        <i className="fa-solid fa-trash-can" />
      </button>
    );
  };

  const renderEditableOrText = (
    fieldPath: string,
    value: string | number,
    type: 'text' | 'number' | 'select' | 'textarea',
    selectOptions?: { value: string; label: string }[],
  ) => {
    if (!editEnabled || !pathPrefix) {
      return <span>{value}</span>;
    }

    if (type === 'number') {
      return (
        <EditableField
          path={`${pathPrefix}.${fieldPath}`}
          value={value}
          type="number"
          numberConfig={{ min: 1, step: 1 }}
        />
      );
    }

    if (type === 'select') {
      return (
        <EditableField
          path={`${pathPrefix}.${fieldPath}`}
          value={value}
          type="select"
          selectConfig={{ options: selectOptions ?? [] }}
        />
      );
    }

    if (type === 'textarea') {
      return <EditableField path={`${pathPrefix}.${fieldPath}`} value={value} type="textarea" />;
    }

    return <EditableField path={`${pathPrefix}.${fieldPath}`} value={value} type="text" />;
  };

  const renderTitle = () => (
    <div className={styles.itemTitle}>
      <div className={styles.itemTitleMain}>
        <span className={`${styles.itemName} ${qualityClass}`.trim()}>{name}</span>
        {titleSuffix ? <span className={styles.itemTitleSuffix}>{titleSuffix}</span> : null}
      </div>
      <div className={styles.itemTitleActions}>{renderDeleteButton()}</div>
    </div>
  );

  const renderMeta = () => {
    if (metaItems.length === 0) return null;

    return (
      <div className={styles.itemMeta}>
        {metaItems.map(meta => (
          <span key={meta.key} className={styles.itemMetaBadge}>
            <span className={styles.itemMetaLabel}>{meta.label}</span>
            <span className={styles.itemMetaValue}>{meta.value}</span>
          </span>
        ))}
      </div>
    );
  };

  const renderTags = (allowEdit = editEnabled && !!pathPrefix) => {
    if (_.isEmpty(data.标签)) return null;

    return (
      <div className={styles.itemTags}>
        {allowEdit ? (
          <EditableField path={`${pathPrefix}.标签`} value={data.标签 ?? []} type="tags" />
        ) : (
          data.标签?.map((tag, idx) => (
            <span key={idx} className={styles.tag}>
              {tag}
            </span>
          ))
        )}
      </div>
    );
  };

  const renderSummary = () => (
    <>
      {renderMeta()}
      {renderTags(false)}
      {data.描述 ? <div className={styles.itemSummaryDesc}>{data.描述}</div> : null}
      {summaryEffectNames.length > 0 ? (
        <div className={styles.itemSummaryEffects}>
          {summaryEffectNames.map(effectName => (
            <span key={effectName} className={styles.itemSummaryEffectChip}>
              {effectName}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );

  const renderDetailContent = () => (
    <div className={styles.itemDetails}>
      {(data.品质 || editEnabled) && (
        <div className={styles.itemFieldRow}>
          <span className={styles.fieldLabel}>品质</span>
          {renderEditableOrText('品质', data.品质 ?? '', 'select', QUALITY_OPTIONS)}
        </div>
      )}

      {(data.类型 || editEnabled) && (
        <div className={styles.itemFieldRow}>
          <span className={styles.fieldLabel}>类型</span>
          {renderEditableOrText('类型', data.类型 ?? '', 'text')}
        </div>
      )}

      {(displayMode === 'modal-detail' || editEnabled) &&
      (itemCategory === 'equipment' || itemCategory === 'item') &&
      (data.位置 || itemCategory === 'equipment') ? (
        <div className={styles.itemFieldRow}>
          <span className={styles.fieldLabel}>位置</span>
          {renderEditableOrText('位置', data.位置 ?? '', 'text')}
        </div>
      ) : null}

      {(displayMode === 'modal-detail' || editEnabled) &&
      (itemCategory === 'skill' || itemCategory === 'item') &&
      (data.消耗 || itemCategory === 'skill') ? (
        <div className={styles.itemFieldRow}>
          <span className={styles.fieldLabel}>消耗</span>
          {renderEditableOrText('消耗', data.消耗 ?? '', 'text')}
        </div>
      ) : null}

      {itemCategory === 'item' && (displayMode === 'modal-detail' || editEnabled) ? (
        <div className={styles.itemFieldRow}>
          <span className={styles.fieldLabel}>数量</span>
          {renderEditableOrText('数量', data.数量 ?? 1, 'number')}
        </div>
      ) : null}

      {renderTags()}

      {(data.描述 || editEnabled) && (
        <div className={styles.itemBlock}>
          <div className={styles.itemBlockTitle}>描述</div>
          <div className={styles.itemDesc}>
            {editEnabled && pathPrefix ? (
              <EditableField path={`${pathPrefix}.描述`} value={data.描述 ?? ''} type="textarea" />
            ) : (
              data.描述
            )}
          </div>
        </div>
      )}

      {(!_.isEmpty(data.效果) || editEnabled) && (
        <div className={styles.itemBlock}>
          <div className={styles.itemBlockTitle}>效果</div>
          <div className={styles.itemEffects}>
            {editEnabled && pathPrefix ? (
              <EditableField path={`${pathPrefix}.效果`} value={data.效果 ?? {}} type="keyvalue" />
            ) : displayMode === 'modal-detail' ? (
              effectEntries.map(([key, value]) => (
                <div key={key} className={styles.effectRow}>
                  <span className={styles.effectKey}>{key}</span>
                  <span className={styles.effectValue}>{value}</span>
                </div>
              ))
            ) : (
              effectNames.map(effectName => (
                <span key={effectName} className={styles.effectChip}>
                  {effectName}
                </span>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (displayMode === 'compact') {
    return (
      <div className={`${styles.itemCompactCard} ${styles[qualityClass] ?? ''}`.trim()}>
        {renderTitle()}
        <div className={styles.itemCompactBody}>{renderDetailContent()}</div>
      </div>
    );
  }

  if (displayMode === 'modal-detail') {
    return <div className={styles.itemModalDetail}>{renderDetailContent()}</div>;
  }

  return (
    <button
      type="button"
      className={`${styles.itemPanelCard} ${styles[qualityClass] ?? ''}`.trim()}
      onClick={onInspect}
    >
      {renderTitle()}
      <div className={styles.itemPanelBody}>{renderSummary()}</div>
    </button>
  );
};
