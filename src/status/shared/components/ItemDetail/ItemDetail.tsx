import { getQualityClass, QualityClassMap } from '@/status/core/utils';
import { FC, useState } from 'react';
import { Collapse } from '../Collapse';
import { ConfirmModal } from '../ConfirmModal';
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
  /** 删除回调 */
  onDelete?: () => void;
  /** 物品类别，用于区分显示不同的字段 */
  itemCategory?: ItemCategory;
}

/**
 * 物品详情组件
 * 用于渲染装备、技能、背包物品的完整信息
 * 复用于 ItemsTab 和 DestinyTab
 * 支持编辑模式下的字段编辑和删除功能
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
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete?.();
  };

  return (
    <>
      <Collapse
        quality={QualityClassMap[data.品质 ?? '']}
        defaultOpen={defaultOpen}
        title={
          <div className={styles.itemTitle}>
            <span className={`${styles.itemName} ${getQualityClass(data.品质, styles)}`}>
              {name}
            </span>
            {titleSuffix}
            {editEnabled && onDelete && (
              <button className={styles.deleteButton} onClick={handleDeleteClick} title="删除">
                <i className="fa-solid fa-trash-can" />
              </button>
            )}
          </div>
        }
      >
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
                  label="品质"
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
                <EditableField
                  path={`${pathPrefix}.类型`}
                  value={data.类型 ?? ''}
                  type="text"
                  label="类型"
                />
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
                  <EditableField
                    path={`${pathPrefix}.位置`}
                    value={data.位置 ?? ''}
                    type="text"
                    label="位置"
                  />
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
                  <EditableField
                    path={`${pathPrefix}.消耗`}
                    value={data.消耗 ?? ''}
                    type="text"
                    label="消耗"
                  />
                ) : (
                  <span>{data.消耗}</span>
                )}
              </div>
            )}

          {/* 数量（背包物品专用） - 编辑模式下可编辑 */}
          {itemCategory === 'item' && (data.数量 !== undefined || editEnabled) && (
            <div className={styles.itemQuantity}>
              <span className={styles.fieldLabel}>数量:</span>
              {editEnabled && pathPrefix ? (
                <EditableField
                  path={`${pathPrefix}.数量`}
                  value={data.数量 ?? 1}
                  type="number"
                  label="数量"
                  numberConfig={{ min: 1, step: 1 }}
                />
              ) : (
                <span>{data.数量}</span>
              )}
            </div>
          )}

          {/* 标签 - 编辑模式下可编辑 */}
          {(!_.isEmpty(data.标签) || editEnabled) && (
            <div className={styles.itemTags}>
              {editEnabled && pathPrefix ? (
                <EditableField
                  path={`${pathPrefix}.标签`}
                  value={data.标签 ?? []}
                  type="tags"
                  label="标签"
                />
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
                <EditableField
                  path={`${pathPrefix}.描述`}
                  value={data.描述 ?? ''}
                  type="textarea"
                  label="描述"
                />
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
                <EditableField
                  path={`${pathPrefix}.效果`}
                  value={data.效果 ?? {}}
                  type="keyvalue"
                  label="效果"
                />
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
      </Collapse>

      {/* 删除确认弹窗 */}
      <ConfirmModal
        open={showDeleteConfirm}
        title="确认删除"
        rows={[{ label: '操作', value: `确定要删除「${name}」吗？此操作不可撤销。` }]}
        buttons={[
          { text: '删除', variant: 'danger', onClick: handleConfirmDelete },
          { text: '取消', variant: 'secondary', onClick: () => setShowDeleteConfirm(false) },
        ]}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};
