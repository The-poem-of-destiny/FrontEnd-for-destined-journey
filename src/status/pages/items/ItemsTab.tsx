import { FC, useEffect, useMemo, useState } from 'react';
import { useDeleteConfirm } from '../../core/hooks';
import { useEditorSettingStore } from '../../core/stores';
import {
  buildSessionKey,
  formatMoney,
  getAssetCollectionSource,
  getAssetFilterOptions,
  getFilteredAssetEntries,
  getQualityClass,
  readSessionState,
  writeSessionState,
} from '../../core/utils';
import type { ItemData } from '../../shared/components';
import {
  DeleteConfirmModal,
  EditableField,
  EmptyHint,
  ItemDetail,
  ItemInspectModal,
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
    filterKey: '类型',
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

type InspectItemState = {
  categoryId: CategoryId;
  name: string;
} | null;

/** 全部筛选项 */
const ALL_FILTER = '全部';

/**
 * 物品页内容组件
 */
const ItemsTabContent: FC<WithMvuDataProps> = ({ data }) => {
  const editEnabled = useEditorSettingStore(state => state.editEnabled);
  const { deleteTarget, setDeleteTarget, handleDelete, cancelDelete, isConfirmOpen } =
    useDeleteConfirm();

  const categoryStorageKey = buildSessionKey('items', 'active-category');
  const filterStorageKey = buildSessionKey('items', 'active-filter');

  const [activeCategory, setActiveCategory] = useState<CategoryId>(() =>
    readSessionState<CategoryId>(categoryStorageKey, 'inventory'),
  );
  const [activeFilter, setActiveFilter] = useState<string>(() =>
    readSessionState<string>(filterStorageKey, ALL_FILTER),
  );
  const [selectedItem, setSelectedItem] = useState<InspectItemState>(null);
  const [inspectItem, setInspectItem] = useState<InspectItemState>(null);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
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

  const inspectCategoryConfig = inspectItem ? getCategoryConfig(inspectItem.categoryId) : null;
  const inspectCategoryData = inspectItem ? getCategoryData(inspectItem.categoryId) : null;
  const inspectedItemData =
    inspectItem && inspectCategoryData ? inspectCategoryData[inspectItem.name] : undefined;

  const selectedCategoryConfig = selectedItem ? getCategoryConfig(selectedItem.categoryId) : null;
  const selectedCategoryData = selectedItem ? getCategoryData(selectedItem.categoryId) : null;
  const selectedItemData =
    selectedItem && selectedCategoryData ? selectedCategoryData[selectedItem.name] : undefined;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 720px)');
    const syncLayout = () => setIsCompactLayout(mediaQuery.matches);

    syncLayout();
    mediaQuery.addEventListener('change', syncLayout);
    return () => mediaQuery.removeEventListener('change', syncLayout);
  }, []);

  useEffect(() => {
    if (activeCategoryConfig.id !== activeCategory) {
      setActiveCategory(activeCategoryConfig.id);
      return;
    }
    writeSessionState(categoryStorageKey, activeCategoryConfig.id);
  }, [activeCategory, activeCategoryConfig.id, categoryStorageKey]);

  useEffect(() => {
    writeSessionState(filterStorageKey, activeFilter);
  }, [activeFilter, filterStorageKey]);

  /** 计算当前类别的所有筛选选项 */
  const filterOptions = useMemo(() => {
    return getAssetFilterOptions(activeCategoryItems, getFilterKey(activeCategory), ALL_FILTER);
  }, [activeCategory, activeCategoryItems]);

  useEffect(() => {
    if (filterOptions.length === 0) return;
    if (!filterOptions.includes(activeFilter)) {
      setActiveFilter(ALL_FILTER);
    }
  }, [activeFilter, filterOptions]);

  const normalizedActiveFilter = filterOptions.includes(activeFilter) ? activeFilter : ALL_FILTER;

  const filteredEntries = useMemo(() => {
    return getFilteredAssetEntries(
      activeCategoryItems,
      getFilterKey(activeCategory),
      normalizedActiveFilter,
      ALL_FILTER,
    );
  }, [activeCategory, activeCategoryItems, normalizedActiveFilter]);

  const activeFilterCountMap = useMemo(() => {
    return filterOptions.reduce<Record<string, number>>((acc, option) => {
      if (option === ALL_FILTER) {
        acc[option] = Object.keys(activeCategoryItems).length;
        return acc;
      }

      acc[option] = _.size(
        _.pickBy(activeCategoryItems, item => _.get(item, getFilterKey(activeCategory)) === option),
      );
      return acc;
    }, {});
  }, [activeCategory, activeCategoryItems, filterOptions]);

  useEffect(() => {
    if (filteredEntries.length === 0) {
      setSelectedItem(null);
      return;
    }

    const selectedStillVisible =
      selectedItem?.categoryId === activeCategory &&
      filteredEntries.some(([name]) => name === selectedItem.name);

    if (!selectedStillVisible) {
      setSelectedItem({
        categoryId: activeCategory,
        name: filteredEntries[0][0],
      });
    }
  }, [activeCategory, filteredEntries, selectedItem]);

  /** 切换类别时重置筛选器 */
  const handleCategoryChange = (category: CategoryId) => {
    setActiveCategory(category);
    setActiveFilter(ALL_FILTER);
    setSelectedItem(null);
    setInspectItem(null);
  };

  const handleSelectItem = (name: string) => {
    const nextItem = {
      categoryId: activeCategory,
      name,
    };

    setSelectedItem(nextItem);
    if (isCompactLayout) {
      setInspectItem(nextItem);
    }
  };

  const handleItemRowKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, name: string) => {
    if (event.target !== event.currentTarget) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    handleSelectItem(name);
  };

  const handleDeleteItemClick = (event: React.MouseEvent<HTMLButtonElement>, name: string) => {
    event.stopPropagation();
    handleDeleteItem(name);
  };

  const handleCloseInspect = () => {
    setInspectItem(null);
  };

  const handleDeleteItem = (name: string) => {
    setDeleteTarget({
      type: activeCategoryConfig.label,
      path: `${activeCategoryConfig.pathPrefix}.${name}`,
      name,
    });
  };

  const getTitleSuffix = (config: typeof activeCategoryConfig, item: ItemData) => {
    if (config.itemCategory === 'item') {
      return <span className={styles.itemCount}>×{item.数量}</span>;
    }

    if (config.itemCategory === 'equipment') {
      return item.位置 ? <span className={styles.itemSlot}>[{item.位置}]</span> : null;
    }

    return item.消耗 ? <span className={styles.itemCost}>{item.消耗}</span> : null;
  };

  const getItemTypeLabel = (item: ItemData) => item.类型 || '未分类';

  const getItemTags = (item: ItemData) => item.标签?.filter(Boolean) ?? [];

  const renderDetail = (
    itemState: InspectItemState,
    config: typeof activeCategoryConfig | null,
    itemData: ItemData | undefined,
  ) => {
    if (!itemState || !config || !itemData) {
      return <EmptyHint className={styles.emptyHint} text="选择一件持有物查看详情" />;
    }

    return (
      <ItemDetail
        name={itemState.name}
        data={itemData}
        titleSuffix={getTitleSuffix(config, itemData)}
        editEnabled={editEnabled}
        pathPrefix={`${config.pathPrefix}.${itemState.name}`}
        itemCategory={config.itemCategory}
        displayMode="modal-detail"
      />
    );
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

  const renderItemList = (emptyText: string) => {
    if (filteredEntries.length === 0) {
      return <EmptyHint className={styles.emptyHint} text={emptyText} />;
    }

    return (
      <div className={styles.itemList}>
        {filteredEntries.map(([name, item]) => {
          const isSelected =
            selectedItem?.categoryId === activeCategory && selectedItem.name === name;
          const qualityClass = getQualityClass(item.品质, styles);
          const itemTags = getItemTags(item);

          return (
            <div
              key={name}
              role="button"
              tabIndex={0}
              className={`${styles.itemRow} ${isSelected ? styles.isSelected : ''}`}
              onClick={() => handleSelectItem(name)}
              onKeyDown={event => handleItemRowKeyDown(event, name)}
            >
              <span className={`${styles.itemQualityMark} ${qualityClass}`.trim()} />
              <span className={styles.itemRowMain}>
                <span className={styles.itemRowTitle}>
                  <span className={`${styles.itemRowName} ${qualityClass}`.trim()}>{name}</span>
                  <span className={styles.itemRowType}>{getItemTypeLabel(item)}</span>
                </span>
                {itemTags.length > 0 ? (
                  <span className={styles.itemRowTags}>
                    {itemTags.map((tag, idx) => (
                      <span key={`${tag}-${idx}`} className={styles.itemRowTag}>
                        {tag}
                      </span>
                    ))}
                  </span>
                ) : null}
              </span>
              <span className={styles.itemRowActions}>
                <span className={styles.itemRowSuffix}>
                  {getTitleSuffix(activeCategoryConfig, item)}
                </span>
                {editEnabled ? (
                  <button
                    type="button"
                    className={styles.itemDeleteButton}
                    onClick={event => handleDeleteItemClick(event, name)}
                    title="删除"
                  >
                    <i className="fa-solid fa-trash-can" />
                  </button>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  /** 渲染背包物品 */
  const renderInventory = () => {
    return renderItemList(
      normalizedActiveFilter === ALL_FILTER
        ? '背包空空如也'
        : `没有${normalizedActiveFilter}类型的物品`,
    );
  };

  /** 渲染装备 */
  const renderEquipment = () => {
    return renderItemList(
      normalizedActiveFilter === ALL_FILTER
        ? '暂无装备'
        : `没有${normalizedActiveFilter}位置的装备`,
    );
  };

  /** 渲染技能 */
  const renderSkills = () => {
    return renderItemList(
      normalizedActiveFilter === ALL_FILTER
        ? '暂无技能'
        : `没有${normalizedActiveFilter}类型的技能`,
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
      <div className={styles.itemsTabHeader}>
        {/* 类别切换 */}
        <div className={styles.itemsTabCategories}>
          {ItemCategories.map(cat => {
            const itemCount = Object.keys(getCategoryData(cat.id)).length;

            return (
              <button
                key={cat.id}
                type="button"
                className={`${styles.categoryBtn} ${activeCategory === cat.id ? styles.isActive : ''}`}
                onClick={() => handleCategoryChange(cat.id)}
              >
                <i className={cat.icon} />
                <span>{cat.label}</span>
                <span className={styles.categoryCount}>{itemCount}</span>
              </button>
            );
          })}
        </div>

        {renderCurrency()}
      </div>

      {/* 子分类筛选器 */}
      {filterOptions.length > 1 && (
        <div className={styles.filterBar}>
          {filterOptions.map(option => (
            <button
              key={option}
              type="button"
              className={`${styles.filterBtn} ${activeFilter === option ? styles.isActive : ''}`}
              onClick={() => setActiveFilter(option)}
            >
              {option}
              <span className={styles.filterCount}>{activeFilterCountMap[option] ?? 0}</span>
            </button>
          ))}
        </div>
      )}

      {/* 内容区域 */}
      <div className={styles.itemsTabContent}>
        <div className={styles.itemsIndex}>{renderCategoryContent()}</div>
        <aside className={styles.itemsDetailPanel}>
          <div className={styles.itemsDetailHeader}>
            <span>{selectedItem?.name ?? '持有物详情'}</span>
            <span>{activeCategoryConfig.label}</span>
          </div>
          <div className={styles.itemsDetailBody}>
            {renderDetail(selectedItem, selectedCategoryConfig, selectedItemData)}
          </div>
        </aside>
      </div>

      {/* 资产详情中央面板 */}
      <ItemInspectModal
        open={!!inspectItem}
        title={inspectItem?.name ?? ''}
        subtitle={
          inspectCategoryConfig ? (
            <span className={styles.inspectSubtitle}>{inspectCategoryConfig.label}</span>
          ) : null
        }
        onClose={handleCloseInspect}
      >
        {inspectItem && inspectCategoryConfig && inspectedItemData
          ? renderDetail(inspectItem, inspectCategoryConfig, inspectedItemData)
          : null}
      </ItemInspectModal>

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
