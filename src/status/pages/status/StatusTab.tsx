import { FC, useEffect, useMemo, useState } from 'react';
import { useDeleteConfirm } from '../../core/hooks';
import { useEditorSettingStore } from '../../core/stores';
import {
  exportAvatarFile,
  getAvatarActionState,
  getAvatarRecord,
  getAvatarScopeKey,
  isAvatarRemovedRecord,
  markAvatarAsRemoved,
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

// 资源条配置
const ResourceFields = [
  { label: 'HP', currentKey: '生命值', maxKey: '生命值上限', type: 'hp' as const },
  { label: 'MP', currentKey: '法力值', maxKey: '法力值上限', type: 'mp' as const },
  { label: 'SP', currentKey: '体力值', maxKey: '体力值上限', type: 'sp' as const },
] as const;

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
    try {
      await markAvatarAsRemoved(avatarScopeKey, 'player', '主角');
      setPlayerAvatarUrl('');
      setIsPlayerAvatarRemoved(true);
    } catch (error) {
      console.warn('[StatusTab] 移除主角头像失败:', error);
    }
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
      <Card className={`${styles.statusTabCard} ${styles.overviewCard}`}>
        <div className={styles.overviewHeader}>
          <div className={styles.overviewHeading}>
            <span className={styles.overviewEyebrow}>角色总览</span>
            <div className={styles.overviewTitleRow}>
              <AvatarPanel
                src={playerAvatarDisplayUrl}
                alt="主角头像"
                size="lg"
                placeholderText="主"
                showEditHint
                className={styles.overviewAvatarInline}
                onClick={() => setIsPlayerAvatarModalOpen(true)}
                onImageError={handlePlayerAvatarImageError}
              />
              <div className={styles.overviewIdentityBlock}>
                <div className={styles.overviewIdentityTopRow}>
                  <span className={styles.overviewLevel}>Lv.{player.等级 ?? 1}</span>
                  <span className={styles.overviewTier}>{player.生命层级 || '未记录生命层级'}</span>
                </div>
                <span className={styles.overviewSubtitle}>
                  {player.冒险者等级 || '未评级冒险者'}
                </span>
              </div>
            </div>
            <div className={styles.overviewStats}>
              {_.map(player.属性, (value, key) => (
                <div key={key} className={styles.overviewStatItem}>
                  <span className={styles.overviewStatLabel}>{key}</span>
                  {editEnabled ? (
                    <EditableField
                      path={`主角.属性.${key}`}
                      value={value ?? 0}
                      type="number"
                      numberConfig={{ min: 0, max: 20, step: 1 }}
                    />
                  ) : (
                    <span className={styles.overviewStatValue}>{value ?? 0}</span>
                  )}
                </div>
              ))}
              <div className={styles.overviewStatItem}>
                <span className={styles.overviewStatLabel}>属性点</span>
                {editEnabled ? (
                  <EditableField
                    path="主角.属性点"
                    value={player.属性点 ?? 0}
                    type="number"
                    numberConfig={{ min: 0, step: 1 }}
                  />
                ) : (
                  <span className={styles.overviewStatValue}>{player.属性点 ?? 0}</span>
                )}
              </div>
            </div>
            <div className={styles.overviewSummaryGrid}>
              <div className={styles.overviewSummaryItem}>
                <span className={styles.overviewStatLabel}>状态效果</span>
                <StatusEffectDisplay
                  effects={statusEffects}
                  mode="chips"
                  maxVisible={4}
                  showRemainingCount
                  emptyText="无效果"
                />
              </div>
              <div className={styles.overviewSummaryItem}>
                <span className={styles.overviewStatLabel}>登神长阶</span>
                <span className={styles.overviewStatSummary}>{ascensionSummary}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.resources}>
          {editEnabled ? (
            <>
              {ResourceFields.map(field => renderResourceField(field))}
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

      <div className={styles.primaryGrid}>
        <Card title="角色档案" className={styles.statusTabCard}>
          <div className={styles.basicInfo}>
            {BasicInfoFields.map(field => renderBasicInfoField(field))}
          </div>
        </Card>
      </div>

      <div className={styles.secondaryStack}>
        <button
          className={styles.detailEntryCard}
          onClick={() => setActiveDetail('status-effects')}
          type="button"
        >
          <div className={styles.detailEntryHeader}>
            <div>
              <div className={styles.detailEntryTitle}>状态效果</div>
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

        <button
          className={styles.detailEntryCard}
          onClick={() => setActiveDetail('ascension')}
          type="button"
        >
          <div className={styles.detailEntryHeader}>
            <div>
              <div className={styles.detailEntryTitle}>登神长阶</div>
              <div className={styles.detailEntrySummary}>{ascensionSummary}</div>
            </div>
            <div className={styles.detailEntryMeta}>
              <span className={styles.detailEntryCount}>
                {ascension?.是否开启 ? '已开启' : '未开启'}
              </span>
              <i className={`fa-solid fa-chevron-right ${styles.detailEntryChevron}`} />
            </div>
          </div>
        </button>
      </div>

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
        canDelete={playerAvatarActionState.canDelete}
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
