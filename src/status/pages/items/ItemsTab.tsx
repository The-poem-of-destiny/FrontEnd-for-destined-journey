import { FC, ReactNode, useMemo, useState } from 'react';
import { sortEntriesByQuality } from '../../core/utils';
import { Card, EmptyHint, ItemDetail } from '../../shared/components';
import { withMvuData, WithMvuDataProps } from '../../shared/hoc';
import styles from './ItemsTab.module.scss';

/** 物品类别 Tab 配置 */
const ItemCategories = [
  { id: 'inventory', label: '背包', icon: 'fa-solid fa-box', filterKey: '类型' },
  { id: 'equipment', label: '装备', icon: 'fa-solid fa-shield', filterKey: '位置' },
  { id: 'skills', label: '技能', icon: 'fa-solid fa-wand-sparkles', filterKey: '类型' },
] as const;

type CategoryId = (typeof ItemCategories)[number]['id'];

/** 全部筛选项 */
const ALL_FILTER = '全部';

/**
 * 物品页内容组件
 */
const ItemsTabContent: FC<WithMvuDataProps> = ({ data }) => {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('inventory');
  const [activeFilter, setActiveFilter] = useState<string>(ALL_FILTER);

  const player = data.主角;

  /** 获取当前类别的数据源 */
  const getCategoryData = (category: CategoryId) => {
    switch (category) {
      case 'inventory':
        return player.背包 ?? {};
      case 'equipment':
        return player.装备 ?? {};
      case 'skills':
        return player.技能 ?? {};
      default:
        return {};
    }
  };

  /** 获取当前类别的筛选字段 */
  const getFilterKey = (category: CategoryId): string => {
    const cat = ItemCategories.find(c => c.id === category);
    return cat?.filterKey ?? '类型';
  };

  /** 计算当前类别的所有筛选选项 */
  const filterOptions = useMemo(() => {
    const items = getCategoryData(activeCategory);
    const filterKey = getFilterKey(activeCategory);
    const values = new Set<string>();

    _.forEach(items, item => {
      const value = _.get(item, filterKey);
      if (value && typeof value === 'string') {
        values.add(value);
      }
    });

    return [ALL_FILTER, ...Array.from(values).sort()];
  }, [activeCategory, data]);

  /** 过滤背包物品 */
  const filteredInventory = useMemo(() => {
    const items = player.背包 ?? {};
    if (activeFilter === ALL_FILTER || activeCategory !== 'inventory') {
      return items;
    }
    return _.pickBy(items, item => item.类型 === activeFilter);
  }, [activeCategory, activeFilter, player.背包]);

  /** 过滤装备 */
  const filteredEquipment = useMemo(() => {
    const items = player.装备 ?? {};
    if (activeFilter === ALL_FILTER || activeCategory !== 'equipment') {
      return items;
    }
    return _.pickBy(items, item => item.位置 === activeFilter);
  }, [activeCategory, activeFilter, player.装备]);

  /** 过滤技能 */
  const filteredSkills = useMemo(() => {
    const items = player.技能 ?? {};
    if (activeFilter === ALL_FILTER || activeCategory !== 'skills') {
      return items;
    }
    return _.pickBy(items, item => item.类型 === activeFilter);
  }, [activeCategory, activeFilter, player.技能]);

  /** 切换类别时重置筛选器 */
  const handleCategoryChange = (category: CategoryId) => {
    setActiveCategory(category);
    setActiveFilter(ALL_FILTER);
  };

  /** 渲染货币 */
  const renderCurrency = () => {
    const money = player.金钱;
    if (!money) return null;

    return (
      <div className={styles.currency}>
        <span className={`${styles.currencyItem} ${styles.currencyItemGold}`}>
          <i className="fa-solid fa-coins" /> {money.金币 ?? 0}
        </span>
        <span className={`${styles.currencyItem} ${styles.currencyItemSilver}`}>
          <i className="fa-solid fa-coins" /> {money.银币 ?? 0}
        </span>
        <span className={`${styles.currencyItem} ${styles.currencyItemCopper}`}>
          <i className="fa-solid fa-coins" /> {money.铜币 ?? 0}
        </span>
      </div>
    );
  };

  const sortItemsByQuality = (items: Record<string, any>) => {
    return sortEntriesByQuality(items);
  };

  const renderItemList = (
    items: Record<string, any>,
    emptyText: string,
    getTitleSuffix: (item: any) => ReactNode,
  ) => {
    if (_.isEmpty(items)) {
      return <EmptyHint className={styles.emptyHint} text={emptyText} />;
    }

    const sortedItems = sortItemsByQuality(items);

    return (
      <div className={styles.itemList}>
        {sortedItems.map(([name, item]) => (
          <ItemDetail key={name} name={name} data={item} titleSuffix={getTitleSuffix(item)} />
        ))}
      </div>
    );
  };

  /** 渲染背包物品 */
  const renderInventory = () => {
    return renderItemList(
      filteredInventory,
      activeFilter === ALL_FILTER ? '背包空空如也' : `没有${activeFilter}类型的物品`,
      item => <span className={styles.itemCount}>×{item.数量}</span>,
    );
  };

  /** 渲染装备 */
  const renderEquipment = () => {
    return renderItemList(
      filteredEquipment,
      activeFilter === ALL_FILTER ? '暂无装备' : `没有${activeFilter}位置的装备`,
      item => (item.位置 ? <span className={styles.itemSlot}>[{item.位置}]</span> : null),
    );
  };

  /** 渲染技能 */
  const renderSkills = () => {
    return renderItemList(
      filteredSkills,
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
                  {_.size(
                    _.pickBy(
                      getCategoryData(activeCategory),
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
    </div>
  );
};

/**
 * 物品页组件（使用 HOC 包装）
 */
export const ItemsTab = withMvuData({ baseClassName: styles.itemsTab })(ItemsTabContent);
