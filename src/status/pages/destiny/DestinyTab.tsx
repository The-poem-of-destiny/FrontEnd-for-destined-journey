import { FC, KeyboardEvent, MouseEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useDeleteConfirm } from '../../core/hooks';
import { useEditorSettingStore } from '../../core/stores';
import {
  buildSessionKey,
  exportAvatarFile,
  getAssetCollectionSource,
  getAssetFilterOptions,
  getAvatarActionState,
  getAvatarRecord,
  getAvatarScopeKey,
  getFilteredAssetEntries,
  markAvatarAsRemoved,
  readAvatarFileAsDataUrl,
  readSessionState,
  saveAvatarRecord,
  writeSessionState,
} from '../../core/utils';
import {
  Ascension,
  AvatarActionModal,
  AvatarPanel,
  Card,
  DeleteConfirmModal,
  EditableField,
  EmptyHint,
  IconTitle,
  ItemDetail,
  StatusEffectDisplay,
} from '../../shared/components';
import { withMvuData, WithMvuDataProps } from '../../shared/hoc';
import styles from './DestinyTab.module.scss';

/** 字段类型 */
type FieldType = 'text' | 'number' | 'textarea' | 'tags' | 'toggle' | 'keyvalue';
type PartnerListCategory = 'all' | 'present' | 'away' | 'contracted';
type PartnerDetailSection =
  | 'overview'
  | 'status'
  | 'equipment'
  | 'skills'
  | 'inventory'
  | 'background';

type PartnerRecord = Record<string, any>;
type PartnerAssetItem = Record<string, any>;
type PartnerAssetSectionConfig = {
  key: Extract<PartnerDetailSection, 'equipment' | 'skills' | 'inventory'>;
  label: string;
  dataKey: '装备' | '技能' | '背包';
  filterKey: '位置' | '类型';
  itemCategory: 'equipment' | 'skill' | 'item';
  emptyText: string;
  getTitleSuffix: (item: PartnerAssetItem) => ReactNode;
};

const ALL_FILTER = '全部';

const PartnerListCategories: Array<{
  key: PartnerListCategory;
  label: string;
  matches: (partner: PartnerRecord) => boolean;
}> = [
  { key: 'all', label: '全部', matches: () => true },
  { key: 'present', label: '在场', matches: partner => Boolean(partner.在场) },
  { key: 'away', label: '不在场', matches: partner => !partner.在场 },
  { key: 'contracted', label: '已缔约', matches: partner => Boolean(partner.命定契约) },
];

const PartnerAssetSections: PartnerAssetSectionConfig[] = [
  {
    key: 'equipment',
    label: '装备',
    dataKey: '装备',
    filterKey: '位置',
    itemCategory: 'equipment',
    emptyText: '暂无装备',
    getTitleSuffix: item =>
      item.位置 ? <span className={styles.equipmentSlot}>[{item.位置}]</span> : null,
  },
  {
    key: 'skills',
    label: '技能',
    dataKey: '技能',
    filterKey: '类型',
    itemCategory: 'skill',
    emptyText: '暂无技能',
    getTitleSuffix: item =>
      item.消耗 ? <span className={styles.skillCost}>{item.消耗}</span> : null,
  },
  {
    key: 'inventory',
    label: '背包',
    dataKey: '背包',
    filterKey: '类型',
    itemCategory: 'item',
    emptyText: '背包空空如也',
    getTitleSuffix: item =>
      item.数量 ? <span className={styles.skillCost}>x{item.数量}</span> : null,
  },
];

/**
 * 命定页内容组件
 */
const DestinyTabContent: FC<WithMvuDataProps> = ({ data }) => {
  const editEnabled = useEditorSettingStore(state => state.editEnabled);
  const { deleteTarget, setDeleteTarget, handleDelete, cancelDelete, isConfirmOpen } =
    useDeleteConfirm();
  const destinyPoints = data.命运点数;
  const partners = data.关系列表;
  const partnerEntries = useMemo(() => Object.entries(partners ?? {}), [partners]);
  const partnerCategoryStorageKey = buildSessionKey('destiny', 'partner-category');
  const partnerNameStorageKey = buildSessionKey('destiny', 'partner-name');
  const partnerMobileDetailOpenStorageKey = buildSessionKey(
    'destiny',
    'partner-mobile-detail-open',
  );
  const partnerDetailStorageKey = buildSessionKey('destiny', 'partner-detail');
  const partnerFilterStorageKey = buildSessionKey('destiny', 'partner-filter');
  const avatarScopeKey = useMemo(() => getAvatarScopeKey(), []);

  const [activePartnerListCategory, setActivePartnerListCategory] = useState<PartnerListCategory>(
    () => readSessionState<PartnerListCategory>(partnerCategoryStorageKey, 'present'),
  );
  const [selectedPartnerName, setSelectedPartnerName] = useState<string | null>(() =>
    readSessionState<string | null>(partnerNameStorageKey, null),
  );
  const [isPartnerDetailOpen, setIsPartnerDetailOpen] = useState<boolean>(() =>
    readSessionState<boolean>(partnerMobileDetailOpenStorageKey, false),
  );
  const [activePartnerDetailSection, setActivePartnerDetailSection] =
    useState<PartnerDetailSection>(() =>
      readSessionState<PartnerDetailSection>(partnerDetailStorageKey, 'overview'),
    );
  const [activePartnerAssetFilter, setActivePartnerAssetFilter] = useState<string>(() =>
    readSessionState<string>(partnerFilterStorageKey, ALL_FILTER),
  );
  const [partnerAvatarMap, setPartnerAvatarMap] = useState<Record<string, string>>({});
  const [partnerAvatarRemovedMap, setPartnerAvatarRemovedMap] = useState<Record<string, boolean>>(
    {},
  );
  const [activeAvatarPartnerName, setActiveAvatarPartnerName] = useState<string | null>(null);

  const partnerCategoryEntries = useMemo(() => {
    return PartnerListCategories.map(category => {
      const entries = partnerEntries.filter(([, partner]) => category.matches(partner));
      return {
        ...category,
        count: entries.length,
        entries,
      };
    });
  }, [partnerEntries]);

  const activePartnerListCategoryConfig =
    partnerCategoryEntries.find(category => category.key === activePartnerListCategory) ??
    partnerCategoryEntries[0];
  const visiblePartnerEntries = activePartnerListCategoryConfig?.entries ?? [];
  const activePartnerName =
    selectedPartnerName && visiblePartnerEntries.some(([name]) => name === selectedPartnerName)
      ? selectedPartnerName
      : (visiblePartnerEntries[0]?.[0] ?? null);
  const activePartner = activePartnerName ? partners?.[activePartnerName] : null;
  const isPartnerDetailVisible = Boolean(isPartnerDetailOpen && activePartnerName && activePartner);
  const activePartnerAssetSection =
    PartnerAssetSections.find(section => section.key === activePartnerDetailSection) ?? null;

  const activePartnerAssetSource = useMemo(() => {
    if (!activePartner || !activePartnerAssetSection) return {};
    return getAssetCollectionSource(activePartner, activePartnerAssetSection.dataKey);
  }, [activePartner, activePartnerAssetSection]);

  const activePartnerAssetEntries = useMemo(() => {
    if (!activePartnerAssetSection) return [];

    return getFilteredAssetEntries(
      activePartnerAssetSource,
      activePartnerAssetSection.filterKey,
      activePartnerAssetFilter,
      ALL_FILTER,
    );
  }, [activePartnerAssetFilter, activePartnerAssetSection, activePartnerAssetSource]);

  const activePartnerAssetFilterOptions = useMemo(() => {
    if (!activePartnerAssetSection) return [ALL_FILTER];

    return getAssetFilterOptions(
      activePartnerAssetSource,
      activePartnerAssetSection.filterKey,
      ALL_FILTER,
    );
  }, [activePartnerAssetSection, activePartnerAssetSource]);

  /**
   * 处理 FP 商店按钮点击
   * 发送用户消息"打开FP商店"并触发 AI 回复
   */
  const handleOpenFpShop = async () => {
    // 发送用户消息
    await createChatMessages([{ role: 'user', message: '打开FP商店' }]);
    // 触发 AI 回复
    await triggerSlash('/trigger');
  };

  /**
   * 渲染可编辑字段行
   * 非编辑模式：保持原有布局
   * 编辑模式：替换为 EditableField
   */
  const renderEditableRow = (
    label: string,
    path: string,
    value: string | number | boolean | string[] | Record<string, any> | undefined,
    type: FieldType,
    rowClass: string,
    labelClass: string,
    valueClass: string,
    config?: {
      numberConfig?: { min?: number; max?: number; step?: number };
      toggleConfig?: { labelOff?: string; labelOn?: string; size?: 'sm' | 'md' };
    },
  ) => {
    // 非编辑模式：空值不显示
    if (!editEnabled && (value === undefined || value === null || value === '')) return null;

    // 格式化显示值
    const formatDisplayValue = () => {
      if (value === undefined || value === null) return '无';
      if (type === 'tags' && Array.isArray(value)) {
        return value.length > 0 ? value.join(' / ') : '无';
      }
      if (type === 'toggle') return value ? '是' : '否';
      if (type === 'keyvalue') {
        if (_.isEmpty(value)) return '无';
        return _.map(value as Record<string, unknown>, (effectValue, effectKey) => {
          const displayValue =
            effectValue === undefined || effectValue === null || effectValue === ''
              ? '无'
              : String(effectValue);
          return `${effectKey}: ${displayValue}`;
        }).join(' / ');
      }
      if (value === '') return '无';
      return String(value);
    };

    return (
      <div className={rowClass}>
        <span className={labelClass}>{label}</span>
        {editEnabled ? (
          <EditableField
            path={path}
            value={
              value ??
              (type === 'number'
                ? 0
                : type === 'toggle'
                  ? false
                  : type === 'tags'
                    ? []
                    : type === 'keyvalue'
                      ? {}
                      : '')
            }
            type={type}
            {...config}
          />
        ) : (
          <span className={valueClass}>{formatDisplayValue()}</span>
        )}
      </div>
    );
  };

  /**
   * 渲染只读字段行（等级/生命层级等不可编辑字段）
   */
  const renderReadonlyRow = (
    label: string,
    value: string | number | undefined,
    rowClass: string,
    labelClass: string,
    valueClass: string,
  ) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <div className={rowClass}>
        <span className={labelClass}>{label}</span>
        <span className={valueClass}>{value}</span>
      </div>
    );
  };

  const renderAffectionBar = (value: number) => {
    const percentage = Math.abs(value);
    const isNegative = value < 0;

    return (
      <div className={styles.affectionBar}>
        <div className={styles.affectionBarTrack}>
          <div
            className={`${styles.affectionBarFill} ${isNegative ? styles.isNegative : ''}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={`${styles.affectionBarValue} ${isNegative ? styles.isNegative : ''}`}>
          {value}
        </span>
      </div>
    );
  };

  const renderPartnerAssetSection = (
    partnerName: string,
    sectionConfig: PartnerAssetSectionConfig,
  ) => {
    const source = activePartnerAssetSource;
    const sectionClassName =
      sectionConfig.key === 'equipment' ? styles.partnerEquipment : styles.partnerSkills;
    const listClassName =
      sectionConfig.key === 'equipment' ? styles.equipmentList : styles.skillList;
    const totalCount = Object.keys(source).length;

    if (totalCount === 0 && !editEnabled) {
      return <EmptyHint className={styles.emptyHint} text={sectionConfig.emptyText} />;
    }

    return (
      <div className={sectionClassName}>
        <div className={styles.partnerAssetHeader}>
          <div>
            <div className={styles.sectionLabel}>{sectionConfig.label}</div>
            <div className={styles.partnerAssetSummary}>
              当前显示 {activePartnerAssetEntries.length} / {totalCount} 项
            </div>
          </div>
        </div>

        {activePartnerAssetFilterOptions.length > 1 && (
          <div className={styles.partnerAssetFilterBar}>
            {activePartnerAssetFilterOptions.map(option => {
              const optionCount =
                option === ALL_FILTER
                  ? totalCount
                  : _.size(
                      _.pickBy(
                        source,
                        (item: PartnerAssetItem) => _.get(item, sectionConfig.filterKey) === option,
                      ),
                    );

              return (
                <button
                  key={option}
                  type="button"
                  className={`${styles.partnerAssetFilterBtn} ${activePartnerAssetFilter === option ? styles.partnerAssetFilterBtnActive : ''}`}
                  onClick={() => setActivePartnerAssetFilter(option)}
                >
                  <span>{option}</span>
                  <span className={styles.partnerAssetFilterCount}>{optionCount}</span>
                </button>
              );
            })}
          </div>
        )}

        {activePartnerAssetEntries.length > 0 ? (
          <div className={listClassName}>
            {activePartnerAssetEntries.map(([name, item]) => (
              <ItemDetail
                key={name}
                name={name}
                data={item}
                titleSuffix={sectionConfig.getTitleSuffix(item)}
                editEnabled={editEnabled}
                pathPrefix={`关系列表.${partnerName}.${sectionConfig.dataKey}.${name}`}
                onDelete={() =>
                  setDeleteTarget({
                    type: sectionConfig.label,
                    path: `关系列表.${partnerName}.${sectionConfig.dataKey}.${name}`,
                    name,
                  })
                }
                itemCategory={sectionConfig.itemCategory}
                displayMode="compact"
              />
            ))}
          </div>
        ) : (
          <EmptyHint
            className={styles.emptyHint}
            text={`没有${activePartnerAssetFilter}分类的${sectionConfig.label}`}
          />
        )}
      </div>
    );
  };

  const renderStatusEffectsSection = (
    effects: Record<string, Record<string, any>> | undefined,
    partnerName: string,
  ) => {
    if (_.isEmpty(effects) && !editEnabled) {
      return (
        <div className={styles.partnerSkills}>
          <div className={styles.sectionLabel}>状态效果</div>
          <EmptyHint className={styles.emptyHint} text="暂无 Buff" />
        </div>
      );
    }

    return (
      <div className={styles.partnerSkills}>
        <div className={styles.sectionLabel}>状态效果</div>
        <StatusEffectDisplay
          effects={effects ?? {}}
          editEnabled={editEnabled}
          pathPrefix={`关系列表.${partnerName}.状态效果`}
          emptyText="无"
          onDelete={(effectName: string) =>
            setDeleteTarget({
              type: '状态效果',
              path: `关系列表.${partnerName}.状态效果.${effectName}`,
              name: effectName,
            })
          }
        />
      </div>
    );
  };

  const renderPartnerDeleteButton = (partnerName: string) => {
    if (!editEnabled) {
      return null;
    }

    return (
      <button
        className={styles.deletePartnerBtn}
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          setDeleteTarget({
            type: '伙伴',
            path: `关系列表.${partnerName}`,
            name: partnerName,
          });
        }}
        title="删除关系"
      >
        <i className="fa-solid fa-trash" />
      </button>
    );
  };

  const renderPartnerIdentity = (
    partnerName: string,
    partner: PartnerRecord,
    showDelete = false,
  ) => (
    <>
      <div className={showDelete ? styles.partnerSummaryHeader : undefined}>
        <IconTitle text={partnerName} className={styles.partnerName} />
        {showDelete ? renderPartnerDeleteButton(partnerName) : null}
      </div>
      <div className={styles.partnerMeta}>
        <span className={styles.affectionBadge}>好感度 {partner.好感度 ?? 0}</span>
        <div className={styles.partnerTags}>
          {partner.在场 && <span className={`${styles.tag} ${styles.tagPresent}`}>在场</span>}
          {partner.命定契约 && (
            <span className={`${styles.tag} ${styles.tagContract}`}>命定契约</span>
          )}
        </div>
      </div>
      <div className={styles.partnerSummaryText}>{getPartnerSummaryText(partner)}</div>
      <div className={styles.partnerSummaryStatus}>{getPartnerStatusSummary(partner)}</div>
    </>
  );

  const renderPartnerSummary = (partnerName: string, partner: PartnerRecord) => (
    <div className={styles.partnerTitle}>
      <div className={styles.partnerTitleMain}>
        <AvatarPanel
          src={getPartnerAvatarUrl(partnerName)}
          alt={`${partnerName}头像`}
          size="md"
          placeholderText={partnerName}
          showEditHint
          className={styles.partnerAvatar}
          onClick={() => openPartnerAvatarModal(partnerName)}
          onImageError={() => handlePartnerAvatarImageError(partnerName)}
        />
        <div className={styles.partnerTitleContent}>
          {renderPartnerIdentity(partnerName, partner)}
        </div>
      </div>
      {renderPartnerDeleteButton(partnerName)}
    </div>
  );

  const getPartnerRoleText = (partner: PartnerRecord) => {
    const roleParts = [
      partner.种族,
      Array.isArray(partner.职业) ? partner.职业.join(' / ') : partner.职业,
      partner.等级 ? `Lv.${partner.等级}` : '',
      partner.生命层级,
    ];

    return _.compact(roleParts).join(' · ') || '暂无定位';
  };

  const getPartnerStatusSummary = (partner: PartnerRecord) => {
    const effects = (partner.状态效果 ?? {}) as Parameters<
      typeof StatusEffectDisplay
    >[0]['effects'];

    return (
      <div className={styles.partnerSummaryStatusRow}>
        <StatusEffectDisplay
          effects={effects}
          mode="chips"
          compact
          maxVisible={3}
          showRemainingCount
          emptyText="暂无 Buff"
        />
      </div>
    );
  };

  const getPartnerAvatarUrl = (partner_name: string) => {
    if (partnerAvatarRemovedMap[partner_name]) {
      return '';
    }

    return partnerAvatarMap[partner_name] ?? '';
  };

  const handlePartnerAvatarUpload = async (partner_name: string, file: File) => {
    try {
      const nextAvatarUrl = await readAvatarFileAsDataUrl(file);
      if (!nextAvatarUrl) {
        return;
      }

      await saveAvatarRecord({
        scope_key: avatarScopeKey,
        owner_type: 'partner',
        owner_name: partner_name,
        source_type: 'upload',
        value: nextAvatarUrl,
      });

      setPartnerAvatarMap(previous => ({
        ...previous,
        [partner_name]: nextAvatarUrl,
      }));
      setPartnerAvatarRemovedMap(previous => ({
        ...previous,
        [partner_name]: false,
      }));
    } catch (error) {
      console.warn('[DestinyTab] 上传伙伴头像失败:', error);
    }
  };

  const handlePartnerAvatarUrlInput = async (partner_name: string, url_input: string) => {
    const nextAvatarUrl = _.trim(url_input || '');
    if (!nextAvatarUrl) {
      return;
    }

    try {
      await saveAvatarRecord({
        scope_key: avatarScopeKey,
        owner_type: 'partner',
        owner_name: partner_name,
        source_type: 'url',
        value: nextAvatarUrl,
      });

      setPartnerAvatarMap(previous => ({
        ...previous,
        [partner_name]: nextAvatarUrl,
      }));
      setPartnerAvatarRemovedMap(previous => ({
        ...previous,
        [partner_name]: false,
      }));
    } catch (error) {
      console.warn('[DestinyTab] 保存伙伴头像链接失败:', error);
    }
  };

  const handlePartnerAvatarExport = async (partner_name: string) => {
    const currentAvatarUrl = getPartnerAvatarUrl(partner_name);
    if (!currentAvatarUrl) {
      return;
    }

    try {
      await exportAvatarFile(`${partner_name}-avatar.png`, currentAvatarUrl);
    } catch (error) {
      console.warn('[DestinyTab] 导出伙伴头像失败:', error);
    }
  };

  const handlePartnerAvatarRemove = async (partner_name: string) => {
    try {
      await markAvatarAsRemoved(avatarScopeKey, 'partner', partner_name);
      setPartnerAvatarMap(previous => ({
        ...previous,
        [partner_name]: '',
      }));
      setPartnerAvatarRemovedMap(previous => ({
        ...previous,
        [partner_name]: true,
      }));
    } catch (error) {
      console.warn('[DestinyTab] 删除伙伴头像失败:', error);
    }
  };

  const handlePartnerAvatarImageError = (partner_name: string) => {
    setPartnerAvatarMap(previous => ({
      ...previous,
      [partner_name]: '',
    }));
  };

  const openPartnerAvatarModal = (partner_name: string) => {
    setActiveAvatarPartnerName(partner_name);
  };

  const closePartnerAvatarModal = () => {
    setActiveAvatarPartnerName(null);
  };

  const getPartnerSummaryText = (partner: PartnerRecord) => getPartnerRoleText(partner);

  const handlePartnerSelect = (partnerName: string) => {
    setSelectedPartnerName(partnerName);
    setActivePartnerDetailSection('overview');
    setActivePartnerAssetFilter(ALL_FILTER);
    setIsPartnerDetailOpen(true);
  };

  const handlePartnerDetailBack = () => {
    setIsPartnerDetailOpen(false);
    setActivePartnerDetailSection('overview');
    setActivePartnerAssetFilter(ALL_FILTER);
  };

  const handlePartnerListCategoryChange = (category: PartnerListCategory) => {
    setActivePartnerListCategory(category);
    setSelectedPartnerName(null);
    setActivePartnerDetailSection('overview');
    setActivePartnerAssetFilter(ALL_FILTER);
    setIsPartnerDetailOpen(false);
  };

  const handlePartnerDetailSectionChange = (section: PartnerDetailSection) => {
    setActivePartnerDetailSection(section);
    setActivePartnerAssetFilter(ALL_FILTER);
  };

  const renderPartnerListItem = (partnerName: string, partner: PartnerRecord) => (
    <div
      className={`${styles.partnerSummaryCard} ${activePartnerName === partnerName ? styles.partnerSummaryCardActive : ''}`}
      onClick={() => handlePartnerSelect(partnerName)}
      role="button"
      tabIndex={0}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handlePartnerSelect(partnerName);
        }
      }}
    >
      <div className={styles.partnerSummaryMain}>
        <AvatarPanel
          src={getPartnerAvatarUrl(partnerName)}
          alt={`${partnerName}头像`}
          size="md"
          placeholderText={partnerName}
          showEditHint
          className={styles.partnerAvatar}
          onClick={() => openPartnerAvatarModal(partnerName)}
          onImageError={() => handlePartnerAvatarImageError(partnerName)}
        />
        <div className={styles.partnerSummaryBody}>
          {renderPartnerIdentity(partnerName, partner, true)}
        </div>
      </div>
    </div>
  );

  const renderPartnerDetails = (partnerName: string, partner: PartnerRecord) => {
    const detailSections: Array<{ key: PartnerDetailSection; label: string }> = [
      { key: 'overview', label: '概览' },
      { key: 'status', label: '状态' },
      { key: 'equipment', label: '装备' },
      { key: 'skills', label: '技能' },
      { key: 'inventory', label: '背包' },
      { key: 'background', label: '背景' },
    ];

    return (
      <div className={styles.partnerDetails}>
        <div className={styles.partnerDetailNav}>
          {detailSections.map(section => (
            <button
              key={section.key}
              type="button"
              className={`${styles.partnerDetailTab} ${activePartnerDetailSection === section.key ? styles.partnerDetailTabActive : ''}`}
              onClick={() => handlePartnerDetailSectionChange(section.key)}
            >
              {section.label}
            </button>
          ))}
        </div>

        {activePartnerDetailSection === 'overview' && (
          <>
            <div className={styles.partnerOverviewHero}>
              <div className={styles.partnerOverviewPrimary}>
                <div className={styles.partnerAffection}>
                  <span className={styles.label}>好感度</span>
                  {editEnabled ? (
                    <EditableField
                      path={`关系列表.${partnerName}.好感度`}
                      value={partner.好感度 ?? 0}
                      type="number"
                      numberConfig={{ min: -100, max: 100, step: 1 }}
                    />
                  ) : (
                    renderAffectionBar(partner.好感度 ?? 0)
                  )}
                </div>

                {editEnabled && (
                  <div className={styles.partnerStatusToggles}>
                    <div className={styles.toggleRow}>
                      <span className={styles.toggleLabel}>在场状态</span>
                      <EditableField
                        path={`关系列表.${partnerName}.在场`}
                        value={partner.在场 ?? false}
                        type="toggle"
                        toggleConfig={{ labelOff: '离场', labelOn: '在场', size: 'sm' }}
                      />
                    </div>
                    <div className={styles.toggleRow}>
                      <span className={styles.toggleLabel}>命定契约</span>
                      <EditableField
                        path={`关系列表.${partnerName}.命定契约`}
                        value={partner.命定契约 ?? false}
                        type="toggle"
                        toggleConfig={{ labelOff: '未缔结', labelOn: '已缔结', size: 'sm' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.partnerOverviewStats}>
                <div className={styles.partnerInfoPanel}>
                  <div className={styles.sectionLabel}>基础信息</div>
                  <div className={styles.partnerInfo}>
                    {renderEditableRow(
                      '种族',
                      `关系列表.${partnerName}.种族`,
                      partner.种族,
                      'text',
                      styles.infoRow,
                      styles.infoLabel,
                      styles.infoValue,
                    )}
                    {renderEditableRow(
                      '身份',
                      `关系列表.${partnerName}.身份`,
                      partner.身份,
                      'tags',
                      styles.infoRow,
                      styles.infoLabel,
                      styles.infoValue,
                    )}
                    {renderEditableRow(
                      '职业',
                      `关系列表.${partnerName}.职业`,
                      partner.职业,
                      'tags',
                      styles.infoRow,
                      styles.infoLabel,
                      styles.infoValue,
                    )}
                    {renderReadonlyRow(
                      '生命层级',
                      partner.生命层级,
                      styles.infoRow,
                      styles.infoLabel,
                      styles.infoValue,
                    )}
                    {renderReadonlyRow(
                      '等级',
                      partner.等级 ? `Lv.${partner.等级}` : '',
                      styles.infoRow,
                      styles.infoLabel,
                      styles.infoValue,
                    )}
                  </div>
                </div>

                {!_.isEmpty(partner.属性) && (
                  <div className={styles.partnerInfoPanel}>
                    <div className={styles.sectionLabel}>属性</div>
                    <div
                      className={`${styles.attributeGrid} ${editEnabled ? styles.attributeGridEdit : ''}`}
                    >
                      {_.map(partner.属性, (value: number | undefined, key: string) => (
                        <div
                          key={key}
                          className={`${styles.attributeItem} ${editEnabled ? styles.attributeItemEdit : ''}`}
                        >
                          <span className={styles.attributeKey}>{key}</span>
                          {editEnabled ? (
                            <EditableField
                              path={`关系列表.${partnerName}.属性.${key}`}
                              value={value ?? 0}
                              type="number"
                              numberConfig={{ min: 0, max: 20, step: 1 }}
                            />
                          ) : (
                            <span className={styles.attributeValue}>{value}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(partner.外貌 || partner.着装 || editEnabled) && (
              <div className={styles.partnerAppearance}>
                {renderEditableRow(
                  '外貌',
                  `关系列表.${partnerName}.外貌`,
                  partner.外貌,
                  'textarea',
                  styles.appearanceRow,
                  styles.appearanceLabel,
                  styles.appearanceValue,
                )}
                {renderEditableRow(
                  '着装',
                  `关系列表.${partnerName}.着装`,
                  partner.着装,
                  'textarea',
                  styles.appearanceRow,
                  styles.appearanceLabel,
                  styles.appearanceValue,
                )}
              </div>
            )}

            {(partner.性格 || partner.喜爱 || editEnabled) && (
              <div className={styles.partnerTraits}>
                {renderEditableRow(
                  '性格',
                  `关系列表.${partnerName}.性格`,
                  partner.性格,
                  'textarea',
                  styles.traitRow,
                  styles.traitLabel,
                  styles.traitValue,
                )}
                {renderEditableRow(
                  '喜爱',
                  `关系列表.${partnerName}.喜爱`,
                  partner.喜爱,
                  'textarea',
                  styles.traitRow,
                  styles.traitLabel,
                  styles.traitValue,
                )}
              </div>
            )}
          </>
        )}

        {activePartnerDetailSection === 'status' && (
          <>
            {renderStatusEffectsSection(partner.状态效果, partnerName)}
            {partner.登神长阶?.是否开启 && (
              <div className={styles.partnerAscension}>
                <div className={styles.ascensionLabel}>登神长阶</div>
                <Ascension
                  data={partner.登神长阶}
                  compact
                  editEnabled={editEnabled}
                  pathPrefix={`关系列表.${partnerName}.登神长阶`}
                />
              </div>
            )}
          </>
        )}

        {activePartnerAssetSection &&
          renderPartnerAssetSection(partnerName, activePartnerAssetSection)}

        {activePartnerDetailSection === 'background' && (
          <>
            {(partner.心里话 || editEnabled) && (
              <div className={styles.partnerThoughts}>
                {renderEditableRow(
                  '心里话',
                  `关系列表.${partnerName}.心里话`,
                  partner.心里话,
                  'textarea',
                  styles.thoughtsRow,
                  styles.thoughtsLabel,
                  styles.thoughtsContent,
                )}
              </div>
            )}

            {(partner.背景故事 || editEnabled) && (
              <div className={styles.partnerBackground}>
                {renderEditableRow(
                  '背景故事',
                  `关系列表.${partnerName}.背景故事`,
                  partner.背景故事,
                  'textarea',
                  styles.backgroundRow,
                  styles.backgroundLabel,
                  styles.backgroundContent,
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderActivePartnerDetailContent = () =>
    activePartnerName && activePartner ? (
      <>
        <div className={styles.partnerDetailHeader}>
          {renderPartnerSummary(activePartnerName, activePartner)}
        </div>
        {renderPartnerDetails(activePartnerName, activePartner)}
      </>
    ) : (
      <EmptyHint className={styles.emptyHint} text="暂无可查看伙伴" />
    );

  /** 渲染关系列表 */
  const renderPartners = () => {
    if (_.isEmpty(partners)) {
      return <EmptyHint className={styles.emptyHint} text="暂无伙伴" />;
    }

    const detailContent = renderActivePartnerDetailContent();

    return (
      <div className={styles.partnerSectionContent}>
        <div className={styles.partnerCategoryBar}>
          {partnerCategoryEntries.map(category => (
            <button
              key={category.key}
              type="button"
              className={`${styles.partnerCategoryBtn} ${activePartnerListCategory === category.key ? styles.partnerCategoryBtnActive : ''}`}
              onClick={() => handlePartnerListCategoryChange(category.key)}
            >
              <span>{category.label}</span>
              <span className={styles.partnerCategoryCount}>{category.count}</span>
            </button>
          ))}
        </div>

        <div className={styles.partnerMasterDetail}>
          <div
            className={`${styles.partnerSummaryList} ${isPartnerDetailVisible ? styles.partnerSummaryListHiddenMobile : ''}`}
          >
            {visiblePartnerEntries.length > 0 ? (
              visiblePartnerEntries.map(([name, partner]) => (
                <div key={name}>{renderPartnerListItem(name, partner)}</div>
              ))
            ) : (
              <EmptyHint
                className={styles.emptyHint}
                text={`当前“${activePartnerListCategoryConfig?.label ?? '全部'}”分类下暂无伙伴`}
              />
            )}
          </div>

          <div className={styles.partnerDetailPanel}>{detailContent}</div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    let ignore = false;

    const loadPartnerAvatars = async () => {
      try {
        const records = await Promise.all(
          partnerEntries.map(async ([partnerName]) => {
            const avatarRecord = await getAvatarRecord(avatarScopeKey, 'partner', partnerName);
            return [partnerName, avatarRecord] as const;
          }),
        );

        if (ignore) {
          return;
        }

        const nextAvatarMap = records.reduce<Record<string, string>>(
          (result, [partnerName, avatarRecord]) => {
            result[partnerName] =
              avatarRecord?.source_type === 'removed' ? '' : (avatarRecord?.value ?? '');
            return result;
          },
          {},
        );
        const nextRemovedMap = records.reduce<Record<string, boolean>>(
          (result, [partnerName, avatarRecord]) => {
            result[partnerName] = avatarRecord?.source_type === 'removed';
            return result;
          },
          {},
        );

        setPartnerAvatarMap(nextAvatarMap);
        setPartnerAvatarRemovedMap(nextRemovedMap);
      } catch (error) {
        console.warn('[DestinyTab] 读取伙伴头像失败:', error);
        if (!ignore) {
          setPartnerAvatarMap({});
          setPartnerAvatarRemovedMap({});
        }
      }
    };

    void loadPartnerAvatars();

    return () => {
      ignore = true;
    };
  }, [avatarScopeKey, partnerEntries]);

  useEffect(() => {
    writeSessionState(partnerCategoryStorageKey, activePartnerListCategory);
  }, [activePartnerListCategory, partnerCategoryStorageKey]);

  useEffect(() => {
    if (!selectedPartnerName) {
      writeSessionState(partnerNameStorageKey, null);
      return;
    }

    writeSessionState(partnerNameStorageKey, selectedPartnerName);
  }, [partnerNameStorageKey, selectedPartnerName]);

  useEffect(() => {
    writeSessionState(partnerMobileDetailOpenStorageKey, isPartnerDetailOpen);
  }, [isPartnerDetailOpen, partnerMobileDetailOpenStorageKey]);

  useEffect(() => {
    writeSessionState(partnerDetailStorageKey, activePartnerDetailSection);
  }, [activePartnerDetailSection, partnerDetailStorageKey]);

  useEffect(() => {
    writeSessionState(partnerFilterStorageKey, activePartnerAssetFilter);
  }, [activePartnerAssetFilter, partnerFilterStorageKey]);

  useEffect(() => {
    if (!selectedPartnerName || !activePartnerName) return;
    if (selectedPartnerName === activePartnerName) return;
    setSelectedPartnerName(activePartnerName);
  }, [activePartnerName, selectedPartnerName]);

  const activePartnerAvatarActionState = activeAvatarPartnerName
    ? getAvatarActionState({
        current_url: getPartnerAvatarUrl(activeAvatarPartnerName),
        custom_url: partnerAvatarMap[activeAvatarPartnerName],
        removed: partnerAvatarRemovedMap[activeAvatarPartnerName],
      })
    : null;

  return (
    <div
      className={`${styles.destinyTab} ${isPartnerDetailVisible ? styles.destinyTabDetailModeMobile : ''}`}
    >
      {/* FP商店按钮（暂时禁用，待正式上线） */}
      <button className={styles.fpShopBtn} onClick={handleOpenFpShop} disabled title="待上线">
        <i className="fa-solid fa-store" />
        <span>FP商店</span>
        <span className={styles.comingSoonBadge}>待上线</span>
      </button>

      {/* 命运点数 */}
      <Card className={styles.destinyTabPoints}>
        <div className={styles.destinyPoints}>
          <i className={`fa-solid fa-star ${styles.destinyPointsIcon}`} />
          <span className={styles.destinyPointsLabel}>命运点数</span>
          {editEnabled ? (
            <EditableField
              path="命运点数"
              value={destinyPoints ?? 0}
              type="number"
              numberConfig={{ min: 0, step: 1 }}
            />
          ) : (
            <span className={styles.destinyPointsValue}>{destinyPoints ?? 0}</span>
          )}
        </div>
      </Card>

      {/* 关系列表 */}
      <section className={styles.destinyTabPartners}>
        <div className={styles.partnerSectionTitle}>伙伴列表</div>
        {renderPartners()}
      </section>

      {isPartnerDetailVisible && (
        <div className={styles.partnerDetailPageMobile}>
          <div className={styles.partnerDetailPageTopbar}>
            <button className={styles.partnerBackBtn} onClick={handlePartnerDetailBack}>
              <i className="fa-solid fa-chevron-left" />
              <span>返回伙伴列表</span>
            </button>
          </div>
          <div className={styles.partnerDetailPageBody}>{renderActivePartnerDetailContent()}</div>
        </div>
      )}

      {activeAvatarPartnerName ? (
        <AvatarActionModal
          open
          title={`${activeAvatarPartnerName}头像`}
          subtitle="支持导入本地图片、保存图片链接、导出当前头像，或删除当前伙伴头像。"
          linkPlaceholder={`请输入${activeAvatarPartnerName}头像图片链接`}
          canExport={activePartnerAvatarActionState?.canExport ?? false}
          canDelete={activePartnerAvatarActionState?.canDelete ?? false}
          deleteLabel="删除头像"
          onClose={closePartnerAvatarModal}
          onUpload={(file: File) => handlePartnerAvatarUpload(activeAvatarPartnerName, file)}
          onSubmitLink={(url: string) => handlePartnerAvatarUrlInput(activeAvatarPartnerName, url)}
          onExport={() => handlePartnerAvatarExport(activeAvatarPartnerName)}
          onDelete={() => handlePartnerAvatarRemove(activeAvatarPartnerName)}
        />
      ) : null}

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
 * 命定页组件（使用 HOC 包装）
 */
export const DestinyTab = withMvuData({ baseClassName: styles.destinyTab })(DestinyTabContent);
