import type { CSSProperties, FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useDeleteConfirm } from '../../core/hooks';
import { useEditorSettingStore } from '../../core/stores';
import {
  exportAvatarFile,
  getAvatarActionState,
  getAvatarRecord,
  getAvatarScopeKey,
  getIconifyMask,
  isAvatarRemovedRecord,
  readAvatarFileAsDataUrl,
  removeAvatarRecord,
  saveAvatarRecord,
} from '../../core/utils';
import {
  Ascension,
  AvatarActionModal,
  AvatarPanel,
  Card,
  DeleteConfirmModal,
  DetailSheet,
  EditableField,
  ResourceBar,
  StatusEffectDisplay,
} from '../../shared/components';
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

// 角色档案字段，排除冗余字段
const ProfileInfoFields = BasicInfoFields.filter(
  field => !['生命层级', '等级', '冒险者等级'].includes(field.key),
);

// 资源条配置
const ResourceFields = [
  {
    label: 'HP',
    currentKey: '生命值',
    maxKey: '生命值上限',
    type: 'hp' as const,
    icon: 'game-icons:heart-plus',
  },
  {
    label: 'MP',
    currentKey: '法力值',
    maxKey: '法力值上限',
    type: 'mp' as const,
    icon: 'game-icons:water-drop',
  },
  {
    label: 'SP',
    currentKey: '体力值',
    maxKey: '体力值上限',
    type: 'sp' as const,
    icon: 'game-icons:focused-lightning',
  },
] as const;

const AttributeIconMap: Record<string, string> = {
  力量: 'game-icons:fist',
  敏捷: 'game-icons:wingfoot',
  体质: 'game-icons:checked-shield',
  智力: 'game-icons:open-book',
  精神: 'game-icons:semi-closed-eye',
};

const getIconStyle = (icon: string) => ({ '--status-icon': getIconifyMask(icon) }) as CSSProperties;

// 登神标签显示限制
const AscensionPreviewLimit = 5;

// 登神级别
type AscensionPreviewItem = {
  type: 'kingdom' | 'rank' | 'law' | 'power' | 'element';
  label: string;
};

const AscensionPreviewTypeLabel: Record<AscensionPreviewItem['type'], string> = {
  kingdom: '神国',
  rank: '神位',
  law: '法则',
  power: '权能',
  element: '要素',
};

/**
 * 状态页内容组件
 */
const StatusTabContent: FC<WithMvuDataProps> = ({ data }) => {
  const editEnabled = useEditorSettingStore(state => state.editEnabled);
  const { deleteTarget, setDeleteTarget, handleDelete, cancelDelete, isConfirmOpen } =
    useDeleteConfirm();
  const [activeDetail, setActiveDetail] = useState<'status-effects' | 'ascension' | null>(null);
  const [playerAvatarUrl, setPlayerAvatarUrl] = useState<string>('');
  const [playerDefaultAvatarUrl, setPlayerDefaultAvatarUrl] = useState<string>('');
  const [isPlayerAvatarRemoved, setIsPlayerAvatarRemoved] = useState(false);
  const [isPlayerAvatarModalOpen, setIsPlayerAvatarModalOpen] = useState(false);
  const player = data.主角;
  const avatarScopeKey = useMemo(() => getAvatarScopeKey(), []);

  useEffect(() => {
    let ignore = false;

    const loadPlayerAvatar = async () => {
      try {
        const [savedRecord, resolvedAvatarPath] = await Promise.all([
          getAvatarRecord(avatarScopeKey, 'player', '主角'),
          SillyTavern.substituteParams('{{userAvatarPath}}') as unknown as Promise<string>,
        ]);
        const normalizedAvatarPath = _.trim(resolvedAvatarPath || '');
        const normalizedDefaultAvatarPath =
          normalizedAvatarPath && normalizedAvatarPath !== '{{userAvatarPath}}'
            ? normalizedAvatarPath
            : '';

        if (!ignore) {
          setPlayerAvatarUrl(isAvatarRemovedRecord(savedRecord) ? '' : (savedRecord?.value ?? ''));
          setIsPlayerAvatarRemoved(isAvatarRemovedRecord(savedRecord));
          setPlayerDefaultAvatarUrl(normalizedDefaultAvatarPath);
        }
      } catch (error) {
        console.warn('[StatusTab] 读取主角头像失败:', error);
        if (!ignore) {
          setPlayerAvatarUrl('');
          setPlayerDefaultAvatarUrl('');
          setIsPlayerAvatarRemoved(false);
        }
      }
    };

    void loadPlayerAvatar();

    return () => {
      ignore = true;
    };
  }, [avatarScopeKey]);

  const handlePlayerAvatarUpload = async (file: File) => {
    try {
      const nextAvatarUrl = await readAvatarFileAsDataUrl(file);
      if (!nextAvatarUrl) {
        return;
      }

      await saveAvatarRecord({
        scope_key: avatarScopeKey,
        owner_type: 'player',
        owner_name: '主角',
        source_type: 'upload',
        value: nextAvatarUrl,
      });
      setPlayerAvatarUrl(nextAvatarUrl);
      setIsPlayerAvatarRemoved(false);
    } catch (error) {
      console.warn('[StatusTab] 上传主角头像失败:', error);
    }
  };

  const handlePlayerAvatarUrlInput = async (url_input: string) => {
    const nextAvatarUrl = _.trim(url_input || '');

    if (!nextAvatarUrl) {
      return;
    }

    try {
      await saveAvatarRecord({
        scope_key: avatarScopeKey,
        owner_type: 'player',
        owner_name: '主角',
        source_type: 'url',
        value: nextAvatarUrl,
      });
      setPlayerAvatarUrl(nextAvatarUrl);
      setIsPlayerAvatarRemoved(false);
    } catch (error) {
      console.warn('[StatusTab] 保存主角头像链接失败:', error);
    }
  };

  const handlePlayerAvatarExport = async () => {
    if (!playerAvatarDisplayUrl) {
      return;
    }

    try {
      await exportAvatarFile('player-avatar.png', playerAvatarDisplayUrl);
    } catch (error) {
      console.warn('[StatusTab] 导出主角头像失败:', error);
    }
  };

  const handlePlayerAvatarReset = async () => {
    try {
      await removeAvatarRecord(avatarScopeKey, 'player', '主角');
      setPlayerAvatarUrl('');
      setIsPlayerAvatarRemoved(false);
    } catch (error) {
      console.warn('[StatusTab] 恢复默认主角头像失败:', error);
    }
  };

  const handlePlayerAvatarRemove = async () => {
    await handlePlayerAvatarReset();
  };

  const handlePlayerAvatarImageError = () => {
    if (playerAvatarUrl) {
      setPlayerAvatarUrl('');
      return;
    }

    setPlayerDefaultAvatarUrl('');
  };

  /**
   * 格式化基础信息显示值
   */
  const formatDisplayValue = (field: BasicInfoFieldConfig) => {
    const value = _.get(player, field.key);

    if (field.type === 'tags') {
      // 数组类型：空数组显示"无"
      if (_.isArray(value) && value.length > 0) {
        return value.join(' / ');
      }
      return '无';
    }

    const displayValue = value ?? field.defaultValue ?? '';
    // 空字符串显示"无"
    if (displayValue === '') {
      return '无';
    }
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
        <EditableField path={path} value={value ?? field.defaultValue} type={field.type} />
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
          icon={field.icon}
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
            numberConfig={{ min: 0, max: max, step: 1 }}
          />
          <span className={styles.resourceSeparator}>/</span>
          <EditableField
            path={`主角.${field.maxKey}`}
            value={max}
            type="number"
            numberConfig={{ min: 0, step: 1 }}
          />
        </div>
      </div>
    );
  };

  const renderExperienceField = () => {
    const max = _.isNumber(player.升级所需经验) ? player.升级所需经验 : 999;

    if (!editEnabled) {
      return (
        <ResourceBar
          label="EXP"
          current={player.累计经验值 ?? 0}
          max={max}
          type="exp"
          icon="game-icons:round-star"
        />
      );
    }

    return (
      <div className={styles.resourceEditRow}>
        <span className={styles.resourceLabel}>EXP</span>
        <div className={styles.resourceEditors}>
          <EditableField
            path="主角.累计经验值"
            value={player.累计经验值 ?? 0}
            type="number"
            numberConfig={{
              min: 0,
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
    );
  };

  const statusEffects = player.状态效果 ?? {};
  const effectEntries = Object.entries(statusEffects);
  const effectStats = {
    total: effectEntries.length,
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

  // 登神预览按高阶到低阶展示具体名称
  const ascensionPreviewItems: AscensionPreviewItem[] = ascension?.是否开启
    ? [
        ascension?.神国?.名称 ? { type: 'kingdom' as const, label: ascension.神国.名称 } : null,
        ascension?.神位 ? { type: 'rank' as const, label: ascension.神位 } : null,
        ...Object.keys(ascension?.法则 ?? {}).map(label => ({ type: 'law' as const, label })),
        ...Object.keys(ascension?.权能 ?? {}).map(label => ({ type: 'power' as const, label })),
        ...Object.keys(ascension?.要素 ?? {}).map(label => ({ type: 'element' as const, label })),
      ].filter((item): item is AscensionPreviewItem => Boolean(item?.label))
    : [];
  const visibleAscensionPreviewItems = ascensionPreviewItems.slice(0, AscensionPreviewLimit);
  const hiddenAscensionPreviewCount = Math.max(
    ascensionPreviewItems.length - visibleAscensionPreviewItems.length,
    0,
  );
  const playerAvatarDisplayUrl = isPlayerAvatarRemoved
    ? ''
    : playerAvatarUrl || playerDefaultAvatarUrl;

  const playerAvatarActionState = getAvatarActionState({
    current_url: playerAvatarDisplayUrl,
    custom_url: playerAvatarUrl,
    default_url: playerDefaultAvatarUrl,
    removed: isPlayerAvatarRemoved,
  });

  return (
    <div className={styles.statusTab}>
      <Card
        className={`${styles.statusTabCard} ${styles.overviewCard}`}
        bodyClassName={styles.overviewCardBody}
      >
        <div className={styles.dashboardGrid}>
          <div className={styles.leftColumn}>
            <section className={styles.corePanel}>
              <div className={styles.heroRow}>
                <AvatarPanel
                  src={playerAvatarDisplayUrl}
                  alt="主角头像"
                  size="lg"
                  className={styles.heroAvatar}
                  onClick={() => setIsPlayerAvatarModalOpen(true)}
                  onImageError={handlePlayerAvatarImageError}
                />
                <div className={styles.heroIdentity}>
                  <div className={styles.heroTitleRow}>
                    <span className={styles.heroLevel}>Lv.{player.等级 ?? 1}</span>
                    <span className={styles.heroTier}>{player.生命层级 || '未记录生命层级'}</span>
                  </div>
                  <div className={styles.heroSubtitle}>
                    {editEnabled ? (
                      <>
                        <span className={styles.heroSubtitleLabel}>冒险者评级：</span>
                        <EditableField
                          path="主角.冒险者等级"
                          value={player.冒险者等级 || '未评级'}
                          type="text"
                        />
                      </>
                    ) : (
                      <span>冒险者评级：{player.冒险者等级 || '未评级'}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                className={styles.ascensionPreview}
                onClick={() => setActiveDetail('ascension')}
                type="button"
              >
                <div className={styles.ascensionPreviewHeader}>
                  <span className={styles.ascensionPreviewTitle}>
                    <span
                      className={styles.sectionIcon}
                      style={getIconStyle('game-icons:spiked-halo')}
                    />
                    登神长阶
                  </span>
                  <i className={`fa-solid fa-chevron-right ${styles.detailEntryChevron}`} />
                </div>
                {visibleAscensionPreviewItems.length > 0 ? (
                  <div className={styles.ascensionPreviewTags}>
                    {visibleAscensionPreviewItems.map((item, index) => (
                      <span
                        key={`${item.type}-${item.label}-${index}`}
                        className={`${styles.ascensionPreviewTag} ${styles[`ascensionTag${_.upperFirst(item.type)}`] ?? ''}`.trim()}
                      >
                        <span>{AscensionPreviewTypeLabel[item.type]}</span>
                        <strong>{item.label}</strong>
                      </span>
                    ))}
                    {hiddenAscensionPreviewCount > 0 && (
                      <span className={styles.ascensionPreviewTag}>
                        +{hiddenAscensionPreviewCount}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className={styles.ascensionPreviewEmpty}>未开启</span>
                )}
              </button>
            </section>

            <section className={styles.resourcePanel}>
              <div className={styles.resources}>
                {ResourceFields.map(field => renderResourceField(field))}
                {renderExperienceField()}
              </div>
            </section>
          </div>

          <div className={styles.rightColumn}>
            <section className={styles.infoPanel}>
              <span className={styles.sectionTitle}>
                <span className={styles.sectionIcon} style={getIconStyle('game-icons:id-card')} />
                角色档案
              </span>
              <div className={styles.basicInfo}>
                {ProfileInfoFields.map(field => renderBasicInfoField(field))}
              </div>
            </section>

            <section className={styles.attributePanel}>
              <div className={styles.attributePanelHeader}>
                <span className={styles.sectionTitle}>
                  <span className={styles.sectionIcon} style={getIconStyle('game-icons:skills')} />
                  核心属性
                </span>
                <div className={styles.attributePointPill}>
                  <span>自由属性点</span>
                  {editEnabled ? (
                    <EditableField
                      path="主角.属性点"
                      value={player.属性点 ?? 0}
                      type="number"
                      numberConfig={{ min: 0, step: 1 }}
                    />
                  ) : (
                    <strong>{player.属性点 ?? 0}</strong>
                  )}
                </div>
              </div>
              <div className={styles.attributeGrid}>
                {_.map(player.属性, (value, key) => (
                  <div key={key} className={styles.attributeItem}>
                    <span className={styles.attributeLabelGroup}>
                      {AttributeIconMap[key] && (
                        <span
                          className={styles.attributeIcon}
                          style={getIconStyle(AttributeIconMap[key])}
                        />
                      )}
                      <span className={styles.attributeLabel}>{key}</span>
                    </span>
                    {editEnabled ? (
                      <EditableField
                        path={`主角.属性.${key}`}
                        value={value ?? 0}
                        type="number"
                        numberConfig={{ min: 0, max: 20, step: 1 }}
                      />
                    ) : (
                      <span className={styles.attributeValue}>{value ?? 0}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className={styles.detailEntryGrid}>
          <button
            className={styles.detailEntryCard}
            onClick={() => setActiveDetail('status-effects')}
            type="button"
          >
            <div className={styles.detailEntryHeader}>
              <div>
                <div className={styles.detailEntryTitle}>
                  <span
                    className={styles.sectionIcon}
                    style={getIconStyle('game-icons:vitruvian-man')}
                  />
                  状态效果
                </div>
                <div className={styles.detailEntrySummary}>
                  <StatusEffectDisplay
                    effects={statusEffects}
                    mode="chips"
                    compact
                    maxVisible={4}
                    showRemainingCount
                    emptyText="无效果"
                  />
                </div>
              </div>
              <div className={styles.detailEntryMeta}>
                <span className={styles.detailEntryCount}>{effectStats.total}</span>
                <i className={`fa-solid fa-chevron-right ${styles.detailEntryChevron}`} />
              </div>
            </div>
          </button>
        </div>
      </Card>

      <DetailSheet
        open={activeDetail === 'status-effects'}
        title="状态效果"
        subtitle={effectStats.total ? Object.keys(statusEffects).join('、') : '无效果'}
        onClose={() => setActiveDetail(null)}
      >
        <StatusEffectDisplay
          effects={statusEffects}
          editEnabled={editEnabled}
          pathPrefix="主角.状态效果"
          onDelete={(name: string) =>
            setDeleteTarget({
              type: '状态效果',
              path: `主角.状态效果.${name}`,
              name,
            })
          }
        />
      </DetailSheet>

      <DetailSheet
        open={activeDetail === 'ascension'}
        title="登神长阶"
        subtitle={ascensionSummary}
        onClose={() => setActiveDetail(null)}
      >
        <Ascension data={player.登神长阶} editEnabled={editEnabled} pathPrefix="主角.登神长阶" />
      </DetailSheet>

      <AvatarActionModal
        open={isPlayerAvatarModalOpen}
        title="主角头像"
        subtitle={
          playerAvatarDisplayUrl
            ? '支持导入本地图片、保存图片链接、导出当前头像，或恢复到酒馆默认头像。'
            : '当前未设置头像，可导入图片、填写图片链接，或恢复到酒馆默认头像。'
        }
        linkPlaceholder="请输入主角头像图片链接"
        canExport={playerAvatarActionState.canExport}
        canDelete={false}
        canReset={playerAvatarActionState.canReset}
        deleteLabel="删除头像"
        resetLabel="恢复默认"
        onClose={() => setIsPlayerAvatarModalOpen(false)}
        onUpload={handlePlayerAvatarUpload}
        onSubmitLink={handlePlayerAvatarUrlInput}
        onExport={handlePlayerAvatarExport}
        onDelete={handlePlayerAvatarRemove}
        onReset={handlePlayerAvatarReset}
      />

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
 * 状态页组件（使用 HOC 包装）
 */
export const StatusTab = withMvuData({ baseClassName: styles.statusTab })(StatusTabContent);
