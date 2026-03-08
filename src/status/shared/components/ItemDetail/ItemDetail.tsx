import { getQualityClass, QualityClassMap } from '@/status/core/utils';
import { FC } from 'react';
import { Collapse } from '../Collapse';
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
  位置?: string; // 装备专用
  消耗?: string; // 技能专用
  数量?: number; // 背包物品专用
}

/** 物品类别 */
export type ItemCategory = 'equipment' | 'skill' | 'item';

interface ItemDetailProps {
  /** 物品名称 */
  name: string;
  /** 物品数据 */
  data: ItemData;
  /** 额外的标题元素（如数量、位置等） */
  titleSuffix?: React.ReactNode;
  /** 是否默认展开 */
  defaultOpen?: boolean;
  /** 是否启用编辑模式 */
  editEnabled?: boolean;
  /** 数据路径前缀（用于编辑时构建完整路径） */
  pathPrefix?: string;
  /** 删除回调（点击删除按钮时触发，由父组件处理确认弹窗） */
  onDelete?: () => void;
  /** 物品类别，用于区分显示不同的字段 */
  itemCategory?: ItemCategory;
  /** 是否使用非折叠紧凑模式 */
  compact?: boolean;
}

/**
 * 物品详情组件
 * 用于渲染装备、技能、背包物品的完整信息
 * 复用于 ItemsTab 和 DestinyTab
 * 支持编辑模式下的字段编辑和删除功能
 * 注意：删除确认弹窗由父组件控制，本组件只触发 onDelete 回调
 */
export const ItemDetail: FC<ItemDetailProps> = ({
  name,
  data,
  titleSuffix,
  defaultOpen = false,
  editEnabled = false,
  pathPrefix,
  onDelete,
  itemCategory = 'item',
  compact = false,
}) => {
  /** 处理删除按钮点击 */
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const itemTitle = (
    <div className={styles.itemTitle}>
      <span className={`${styles.itemName} ${getQualityClass(data.品质, styles)}`}>{name}</span>
      {titleSuffix}
      {editEnabled && onDelete && (
        <button className={styles.deleteButton} onClick={handleDeleteClick} title="删除">
          <i className="fa-solid fa-trash-can" />
        </button>
      )}
    </div>
  );

  const itemContent = (
    <div className={styles.itemDetails}>
      {/* 品质 - 编辑模式下使用下拉选择 */}
      {(data.品质 || editEnabled) && (
        <div className={styles.itemQuality}>
          <span className={styles.fieldLabel}>品质:</span>
          {editEnabled && pathPrefix ? (
            <EditableField
              path={`${pathPrefix}.品质`}
              value={data.品质 ?? ''}
              type="select"
              selectConfig={{ options: QUALITY_OPTIONS }}
            />
          ) : (
            <span>{data.品质}</span>
          )}
        </div>
      )}

      {/* 类型 - 编辑模式下可编辑 */}
      {(data.类型 || editEnabled) && (
        <div className={styles.itemType}>
          <span className={styles.fieldLabel}>类型:</span>
          {editEnabled && pathPrefix ? (
            <EditableField path={`${pathPrefix}.类型`} value={data.类型 ?? ''} type="text" />
          ) : (
            <span>{data.类型}</span>
          )}
        </div>
      )}

      {/* 位置（装备专用） - 编辑模式下可编辑 */}
      {(itemCategory === 'equipment' || itemCategory === 'item') &&
        (data.位置 || (editEnabled && itemCategory === 'equipment')) && (
          <div className={styles.itemSlot}>
            <span className={styles.fieldLabel}>位置:</span>
            {editEnabled && pathPrefix ? (
              <EditableField path={`${pathPrefix}.位置`} value={data.位置 ?? ''} type="text" />
            ) : (
              <span>{data.位置}</span>
            )}
          </div>
        )}

      {/* 消耗（技能专用） - 编辑模式下可编辑 */}
      {(itemCategory === 'skill' || itemCategory === 'item') &&
        (data.消耗 || (editEnabled && itemCategory === 'skill')) && (
          <div className={styles.itemCost}>
            <span className={styles.fieldLabel}>消耗:</span>
            {editEnabled && pathPrefix ? (
              <EditableField path={`${pathPrefix}.消耗`} value={data.消耗 ?? ''} type="text" />
            ) : (
              <span>{data.消耗}</span>
            )}
          </div>
        )}

      {/* 数量（背包物品专用） - 仅在编辑模式下显示（非编辑模式已在标题后缀显示）*/}
      {itemCategory === 'item' && editEnabled && pathPrefix && (
        <div className={styles.itemQuantity}>
          <span className={styles.fieldLabel}>数量:</span>
          <EditableField
            path={`${pathPrefix}.数量`}
            value={data.数量 ?? 1}
            type="number"
            numberConfig={{ min: 1, step: 1 }}
          />
        </div>
      )}

      {/* 标签 - 只有数据存在时才显示（不提供新增） */}
      {!_.isEmpty(data.标签) && (
        <div className={styles.itemTags}>
          {editEnabled && pathPrefix ? (
            <EditableField path={`${pathPrefix}.标签`} value={data.标签 ?? []} type="tags" />
          ) : (
            data.标签?.map((tag, idx) => (
              <span key={idx} className={styles.tag}>
                {tag}
              </span>
            ))
          )}
        </div>
      )}

      {/* 描述 - 编辑模式下可编辑 */}
      {(data.描述 || editEnabled) && (
        <div className={styles.itemDesc}>
          {editEnabled && pathPrefix ? (
            <EditableField path={`${pathPrefix}.描述`} value={data.描述 ?? ''} type="textarea" />
          ) : (
            data.描述
          )}
        </div>
      )}

      {/* 效果 - 编辑模式下可编辑 */}
      {(!_.isEmpty(data.效果) || editEnabled) && (
        <div className={styles.itemEffects}>
          <div className={styles.effectsHeader}>效果</div>
          {editEnabled && pathPrefix ? (
            <EditableField path={`${pathPrefix}.效果`} value={data.效果 ?? {}} type="keyvalue" />
          ) : (
            _.map(data.效果, (value, key) => (
              <div key={key} className={styles.effectRow}>
                <span className={styles.effectKey}>{key}</span>
                <span className={styles.effectValue}>{value}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <div
        className={`${styles.itemCompactCard} ${styles[getQualityClass(data.品质, styles)] ?? ''}`.trim()}
      >
        {itemTitle}
        {itemContent}
      </div>
    );
  }

  return (
    <Collapse
      quality={QualityClassMap[data.品质 ?? '']}
      defaultOpen={defaultOpen}
      title={itemTitle}
    >
      {itemContent}
    </Collapse>
  );
};
