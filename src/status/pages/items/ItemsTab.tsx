import _ from 'lodash';
import { FC, ReactNode, useMemo, useState } from 'react';
import { useDeleteConfirm } from '../../core/hooks';
import { useEditorSettingStore } from '../../core/stores';
import {
  formatMoney,
  getAssetCollectionSource,
  getAssetFilterOptions,
  getFilteredAssetEntries,
} from '../../core/utils';
import {
  Card,
  DeleteConfirmModal,
  EditableField,
  EmptyHint,
  ItemDetail,
} from '../../shared/components';
import { withMvuData, WithMvuDataProps } from '../../shared/hoc';
import styles from './ItemsTab.module.scss';

/** 物品类别 Tab 配置 */
const ItemCategories = [
  {
    id: 'inventory',
    label: '背包',
    icon: 'fa-solid fa-box',
    filterKey: '类型',
    pathPrefix: '主角.背包',
    itemCategory: 'item' as const,
  },
  {
    id: 'equipment',
    label: '装备',
    icon: 'fa-solid fa-shield',
    filterKey: '位置',
    pathPrefix: '主角.装备',
    itemCategory: 'equipment' as const,
  },
  {
    id: 'skills',
    label: '技能',
    icon: 'fa-solid fa-wand-magic-sparkles',
    filterKey: '类型',
    pathPrefix: '主角.技能',
    itemCategory: 'skill' as const,
  },
] as const;

type CategoryId = (typeof ItemCategories)[number]['id'];

/** 全部筛选项 */
const ALL_FILTER = '全部';

/**
 * 物品页内容组件
 */
const ItemsTabContent: FC<WithMvuDataProps> = ({ data }) => {
  const editEnabled = useEditorSettingStore(state => state.editEnabled);
  const { deleteTarget, setDeleteTarget, handleDelete, cancelDelete, isConfirmOpen } =
    useDeleteConfirm();

  const [activeCategory, setActiveCategory] = useState<CategoryId>('inventory');
  const [activeFilter, setActiveFilter] = useState<string>(ALL_FILTER);

  const player = data.主角;

  /** 获取当前类别配置 */
  const getCategoryConfig = (category: CategoryId) => {
    return ItemCategories.find(c => c.id === category)!;
  };

  /** 获取当前类别的数据源 */
  const getCategoryData = (category: CategoryId) => {
    const config = getCategoryConfig(category);
    return getAssetCollectionSource(player, config.label);
  };

  /** 获取当前类别的筛选字段 */
  const getFilterKey = (category: CategoryId) => {
    const cat = ItemCategories.find(c => c.id === category);
    return cat?.filterKey ?? '类型';
  };

  const activeCategoryConfig = getCategoryConfig(activeCategory);
  const activeCategoryItems = useMemo(
    () => getCategoryData(activeCategory),
    [activeCategory, player.技能, player.装备, player.背包],
  );

  /** 计算当前类别的所有筛选选项 */
  const filterOptions = useMemo(() => {
    return getAssetFilterOptions(activeCategoryItems, getFilterKey(activeCategory), ALL_FILTER);
  }, [activeCategory, activeCategoryItems]);

  const filteredEntries = useMemo(() => {
    return getFilteredAssetEntries(
      activeCategoryItems,
      getFilterKey(activeCategory),
      activeFilter,
      ALL_FILTER,
    );
  }, [activeCategory, activeCategoryItems, activeFilter]);

  /** 切换类别时重置筛选器 */
  const handleCategoryChange = (category: CategoryId) => {
    setActiveCategory(category);
    setActiveFilter(ALL_FILTER);
  };

  /** 渲染货币 */
  const renderCurrency = () => {
    const money = player.金钱 ?? 0;
    if (!money && !editEnabled) return null;

    return (
      <div className={`${styles.currency} ${editEnabled ? styles.currencyEdit : ''}`}>
        <span className={`${styles.currencyItem} ${styles.currencyItemGold}`}>
          <i className="fa-solid fa-coins" />
          {editEnabled ? (
            <EditableField
              path="主角.金钱"
              value={money}
              type="number"
              numberConfig={{ step: 1 }}
            />
          ) : (
            formatMoney(money)
          )}
          <span className={styles.currencyUnit}>G</span>
        </span>
      </div>
    );
  };

  const renderItemList = (emptyText: string, getTitleSuffix: (item: any) => ReactNode) => {
    if (filteredEntries.length === 0) {
      return <EmptyHint className={styles.emptyHint} text={emptyText} />;
    }

    return (
      <div className={styles.itemList}>
        {filteredEntries.map(([name, item]) => (
          <ItemDetail
            key={name}
            name={name}
            data={item}
            titleSuffix={getTitleSuffix(item)}
            editEnabled={editEnabled}
            pathPrefix={`${activeCategoryConfig.pathPrefix}.${name}`}
            itemCategory={activeCategoryConfig.itemCategory}
            onDelete={() =>
              setDeleteTarget({
                type: activeCategoryConfig.label,
                path: `${activeCategoryConfig.pathPrefix}.${name}`,
                name,
              })
            }
          />
        ))}
      </div>
    );
  };

  /** 渲染背包物品 */
  const renderInventory = () => {
    return renderItemList(
      activeFilter === ALL_FILTER ? '背包空空如也' : `没有${activeFilter}类型的物品`,
      item => <span className={styles.itemCount}>×{item.数量}</span>,
    );
  };

  /** 渲染装备 */
  const renderEquipment = () => {
    return renderItemList(
      activeFilter === ALL_FILTER ? '暂无装备' : `没有${activeFilter}位置的装备`,
      item => (item.位置 ? <span className={styles.itemSlot}>[{item.位置}]</span> : null),
    );
  };

  /** 渲染技能 */
  const renderSkills = () => {
    return renderItemList(
      activeFilter === ALL_FILTER ? '暂无技能' : `没有${activeFilter}类型的技能`,
      item => (item.消耗 ? <span className={styles.itemCost}>{item.消耗}</span> : null),
    );
  };

  /** 渲染当前类别内容 */
  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'inventory':
        return renderInventory();
      case 'equipment':
        return renderEquipment();
      case 'skills':
        return renderSkills();
      default:
        return null;
    }
  };

  return (
    <div className={styles.itemsTab}>
      {/* 货币显示 */}
      <Card className={styles.itemsTabCurrency}>{renderCurrency()}</Card>

      {/* 类别切换 */}
      <div className={styles.itemsTabCategories}>
        {ItemCategories.map(cat => (
          <button
            key={cat.id}
            className={`${styles.categoryBtn} ${activeCategory === cat.id ? styles.isActive : ''}`}
            onClick={() => handleCategoryChange(cat.id)}
          >
            <i className={cat.icon} />
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* 子分类筛选器 */}
      {filterOptions.length > 1 && (
        <div className={styles.filterBar}>
          {filterOptions.map(option => (
            <button
              key={option}
              className={`${styles.filterBtn} ${activeFilter === option ? styles.isActive : ''}`}
              onClick={() => setActiveFilter(option)}
            >
              {option}
              {option !== ALL_FILTER && (
                <span className={styles.filterCount}>
                  {option === ALL_FILTER
                    ? Object.keys(activeCategoryItems).length
                    : _.size(
                        _.pickBy(
                          activeCategoryItems,
                          item => _.get(item, getFilterKey(activeCategory)) === option,
                        ),
                      )}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 内容区域 */}
      <div className={styles.itemsTabContent}>{renderCategoryContent()}</div>

      {/* 删除确认弹窗 */}
      <DeleteConfirmModal
        open={isConfirmOpen}
        target={deleteTarget}
        onConfirm={handleDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

/**
 * 物品页组件（使用 HOC 包装）
 */
export const ItemsTab = withMvuData({ baseClassName: styles.itemsTab })(ItemsTabContent);
