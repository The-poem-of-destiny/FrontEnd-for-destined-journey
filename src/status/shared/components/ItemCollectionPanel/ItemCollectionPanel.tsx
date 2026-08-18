import { FC, useEffect, useMemo, useState } from 'react';
import { useDeleteConfirm } from '../../../core/hooks';
import { useEditorSettingStore, useMvuDataStore } from '../../../core/stores';
import {
  buildSessionKey,
  getAssetCollectionSource,
  getAssetFilterOptions,
  getFilteredAssetEntries,
  getQualityClass,
  readSessionState,
  writeSessionState,
} from '../../../core/utils';
import { DeleteConfirmModal } from '../DeleteConfirmModal';
import { EmptyHint } from '../EmptyHint';
import { ItemDetail } from '../ItemDetail';
import { ItemInspectModal } from '../ItemInspectModal';
import type { ItemCategory, ItemData } from '../ItemDetail';
import styles from './ItemCollectionPanel.module.scss';

/** 筛选/搜索状态存储前缀（按 scopeKey 隔离） */
const buildPanelStorageKey = (scopeKey: string, key: string) => buildSessionKey(scopeKey, key);

const ALL_FILTER = '全部';

export interface ItemCollectionPanelProps {
  /** session 存储前缀（用于记住筛选/搜索状态） */
  scopeKey: string;
  /** 分类名：背包/装备/技能/资产（同时是数据 key） */
  label: '背包' | '装备' | '技能' | '资产';
  /** 完整数据路径前缀，如 关系列表.珂莱娅.背包 */
  pathPrefix: string;
  /** 筛选字段（类型/位置等） */
  filterKey: string;
  /** 物品类别 */
  itemCategory: ItemCategory;
  /** 数据源对象（主角或伙伴） */
  source: Record<string, any>;
  /** 空态文案 */
  emptyText: string;
}

/**
 * 单类别物品集合面板
 * 复用持有物页的搜索/筛选/列表行/详情弹窗整套交互与视觉，
 * 供持有物页与伙伴详情（装备/技能/背包/资产）共用。
 */
export const ItemCollectionPanel: FC<ItemCollectionPanelProps> = ({
  scopeKey,
  label,
  pathPrefix,
  filterKey,
  itemCategory,
  source,
  emptyText,
}) => {
  const editEnabled = useEditorSettingStore(state => state.editEnabled);
  const { updateField } = useMvuDataStore();
  const { deleteTarget, setDeleteTarget, handleDelete, cancelDelete, isConfirmOpen } =
    useDeleteConfirm();

  const filterStorageKey = buildPanelStorageKey(scopeKey, 'filter');
  const searchStorageKey = buildPanelStorageKey(scopeKey, 'search');

  const [activeFilter, setActiveFilter] = useState<string>(() =>
    readSessionState<string>(filterStorageKey, ALL_FILTER),
  );
  const [searchKeyword, setSearchKeyword] = useState<string>(() =>
    readSessionState<string>(searchStorageKey, ''),
  );
  const [inspectItem, setInspectItem] = useState<string | null>(null);
  const [hiddenGroupExpanded, setHiddenGroupExpanded] = useState(false);

  const items = useMemo(() => getAssetCollectionSource(source, label), [source, label]);

  /** 当前类别的所有筛选选项 */
  const filterOptions = useMemo(
    () => getAssetFilterOptions(items, filterKey, ALL_FILTER),
    [items, filterKey],
  );

  useEffect(() => {
    if (filterOptions.length === 0) return;
    if (!filterOptions.includes(activeFilter)) {
      setActiveFilter(ALL_FILTER);
    }
  }, [activeFilter, filterOptions]);

  useEffect(() => {
    writeSessionState(filterStorageKey, activeFilter);
  }, [activeFilter, filterStorageKey]);

  useEffect(() => {
    writeSessionState(searchStorageKey, searchKeyword);
  }, [searchKeyword, searchStorageKey]);

  const normalizedActiveFilter = filterOptions.includes(activeFilter) ? activeFilter : ALL_FILTER;

  const filteredEntries = useMemo(() => {
    const entries = getFilteredAssetEntries(items, filterKey, normalizedActiveFilter, ALL_FILTER);

    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return entries;

    return entries.filter(([name, item]) => {
      const haystack = [name, item.类型 ?? '', ...(item.标签 ?? [])].join(' ').toLowerCase();
      return haystack.includes(keyword);
    });
  }, [items, filterKey, normalizedActiveFilter, searchKeyword]);

  const activeFilterCountMap = useMemo(() => {
    return filterOptions.reduce<Record<string, number>>((acc, option) => {
      if (option === ALL_FILTER) {
        acc[option] = Object.keys(items).length;
        return acc;
      }

      acc[option] = _.size(_.pickBy(items, item => _.get(item, filterKey) === option));
      return acc;
    }, {});
  }, [items, filterKey, filterOptions]);

  const inspectedItemData = inspectItem ? items[inspectItem] : undefined;

  /** 切换隐藏状态（背包/技能/资产支持，装备不支持） */
  const handleToggleItemHidden = async (name: string) => {
    const item = items[name];
    const success = await updateField(`${pathPrefix}.${name}._隐藏`, !item._隐藏);
    if (!success) {
      toastr.error('隐藏状态切换失败');
    }
  };

  const handleDeleteItem = (name: string) => {
    setDeleteTarget({
      type: label,
      path: `${pathPrefix}.${name}`,
      name,
    });
  };

  /** 列表行右侧标题后缀（与持有物页一致） */
  const getTitleSuffix = (item: ItemData) => {
    if (itemCategory === 'item') {
      return <span className={styles.itemCount}>×{item.数量}</span>;
    }

    if (itemCategory === 'equipment') {
      return item.位置 ? <span className={styles.itemSlot}>[{item.位置}]</span> : null;
    }

    if (itemCategory === 'asset') {
      const internalCount = Object.keys(item.内部资产 ?? {}).length;
      return internalCount > 0 ? (
        <span className={styles.itemCost}>内部 {internalCount}</span>
      ) : null;
    }

    return item.消耗 ? <span className={styles.itemCost}>{item.消耗}</span> : null;
  };

  /** 详情弹窗标题行右侧操作（装备不支持） */
  const renderDetailHeaderActions = (name: string) => {
    if (itemCategory === 'equipment') return null;
    const itemData = items[name];
    if (!itemData) return null;
    const isHidden = !!itemData._隐藏;

    return (
      <div className={styles.panelActions}>
        <button
          type="button"
          className={`${styles.itemHideButton} ${isHidden ? styles.isHidden : ''}`}
          onClick={() => {
            void handleToggleItemHidden(name);
          }}
          title={isHidden ? '取消隐藏' : '隐藏'}
        >
          <i className={`fa-solid ${isHidden ? 'fa-circle-plus' : 'fa-circle-minus'}`} />
        </button>
        <button
          type="button"
          className={styles.itemDeleteButton}
          onClick={() => handleDeleteItem(name)}
          title="删除"
        >
          <i className="fa-solid fa-trash-can" />
        </button>
      </div>
    );
  };

  const renderItemRow = ([name, item]: (typeof filteredEntries)[number]) => {
    const qualityClass = getQualityClass(item.品质, styles);
    const itemTags: string[] = ((item.标签 ?? []) as string[]).filter(Boolean);

    return (
      <div
        key={name}
        role="button"
        tabIndex={0}
        className={styles.itemRow}
        onClick={() => setInspectItem(name)}
        onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
          if (event.target !== event.currentTarget) return;
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          setInspectItem(name);
        }}
      >
        <span className={`${styles.itemQualityMark} ${qualityClass}`.trim()} />
        <span className={styles.itemRowMain}>
          <span className={styles.itemRowTitle}>
            <span className={`${styles.itemRowName} ${qualityClass}`.trim()}>{name}</span>
            <span className={styles.itemRowType}>{item.类型 || '未分类'}</span>
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
          <span className={styles.itemRowSuffix}>{getTitleSuffix(item)}</span>
          {editEnabled && itemCategory !== 'equipment' && (
            <button
              type="button"
              className={`${styles.itemHideButton} ${item._隐藏 ? styles.isHidden : ''}`}
              onClick={event => {
                event.stopPropagation();
                void handleToggleItemHidden(name);
              }}
              title={item._隐藏 ? '取消隐藏' : '隐藏'}
            >
              <i className={`fa-solid ${item._隐藏 ? 'fa-circle-plus' : 'fa-circle-minus'}`} />
            </button>
          )}
          {editEnabled && (
            <button
              type="button"
              className={styles.itemDeleteButton}
              onClick={event => {
                event.stopPropagation();
                handleDeleteItem(name);
              }}
              title="删除"
            >
              <i className="fa-solid fa-trash-can" />
            </button>
          )}
        </span>
      </div>
    );
  };

  const visibleEntries = filteredEntries.filter(([, item]) => !item._隐藏);
  const hiddenEntries = filteredEntries.filter(([, item]) => item._隐藏);

  return (
    <>
      <div className={styles.searchBar}>
        <i className="fa-solid fa-magnifying-glass" />
        <input
          type="text"
          className={styles.searchInput}
          placeholder={`搜索${label}名称/类型/标签`}
          value={searchKeyword}
          onChange={event => setSearchKeyword(event.target.value)}
        />
        {searchKeyword && (
          <button
            type="button"
            className={styles.searchClear}
            onClick={() => setSearchKeyword('')}
            title="清空搜索"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        )}
      </div>

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

      {filteredEntries.length === 0 ? (
        <EmptyHint
          className={styles.emptyHint}
          text={searchKeyword.trim() ? '没有找到匹配的物品' : emptyText}
        />
      ) : (
        <div className={styles.itemList}>
          {visibleEntries.map(renderItemRow)}
          {hiddenEntries.length > 0 && (
            <div className={styles.hiddenGroup}>
              <button
                type="button"
                className={styles.hiddenGroupToggle}
                onClick={() => setHiddenGroupExpanded(expanded => !expanded)}
                aria-expanded={hiddenGroupExpanded}
              >
                <i
                  className={`fa-solid ${hiddenGroupExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`}
                />
                <span>已隐藏（{hiddenEntries.length}）</span>
              </button>
              {hiddenGroupExpanded && (
                <div className={styles.hiddenGroupBody}>{hiddenEntries.map(renderItemRow)}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 物品详情弹窗 */}
      <ItemInspectModal
        open={!!inspectItem}
        title={inspectItem ?? ''}
        headerActions={inspectItem ? renderDetailHeaderActions(inspectItem) : null}
        onClose={() => setInspectItem(null)}
      >
        {inspectItem && inspectedItemData ? (
          <ItemDetail
            name={inspectItem}
            data={inspectedItemData}
            titleSuffix={getTitleSuffix(inspectedItemData)}
            editEnabled={editEnabled}
            pathPrefix={`${pathPrefix}.${inspectItem}`}
            itemCategory={itemCategory}
            displayMode="modal-detail"
          />
        ) : null}
      </ItemInspectModal>

      {/* 删除确认弹窗 */}
      <DeleteConfirmModal
        open={isConfirmOpen}
        target={deleteTarget}
        onConfirm={handleDelete}
        onCancel={cancelDelete}
      />
    </>
  );
};
