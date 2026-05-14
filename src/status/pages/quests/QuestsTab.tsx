import _ from 'lodash';
import { FC, useEffect, useMemo, useState } from 'react';
import { useDeleteConfirm } from '../../core/hooks';
import { useEditorSettingStore } from '../../core/stores';
import type { Task } from '../../core/types';
import { buildSessionKey, readSessionState, writeSessionState } from '../../core/utils';
import {
  Card,
  DeleteConfirmModal,
  EditableField,
  EmptyHint,
  IconTitle,
  ItemInspectModal,
} from '../../shared/components';
import { withMvuData, WithMvuDataProps } from '../../shared/hoc';
import styles from './QuestsTab.module.scss';

const ALL_STATUS = '全部';

const QuestFields = [
  { key: '状态', label: '状态', type: 'text' as const },
  { key: '关注度', label: '关注度', type: 'select' as const },
  { key: '进展', label: '进展', type: 'textarea' as const },
  { key: '详情', label: '详情', type: 'textarea' as const },
  { key: '目标', label: '目标', type: 'textarea' as const },
  { key: '奖励', label: '奖励', type: 'textarea' as const },
] as const;

type QuestFieldKey = (typeof QuestFields)[number]['key'];

type InspectQuestState = {
  name: string;
  quest: Task;
} | null;

const PriorityRankMap: Record<string, number> = {
  高: 0,
  中: 1,
  低: 2,
};

const PriorityOptions = [
  { value: '高', label: '高' },
  { value: '中', label: '中' },
  { value: '低', label: '低' },
];

interface QuestSummaryCardProps {
  name: string;
  quest: Task;
  editEnabled: boolean;
  onInspect: () => void;
  onDelete: (name: string, path: string) => void;
}

const QuestSummaryCard: FC<QuestSummaryCardProps> = ({
  name,
  quest,
  editEnabled,
  onInspect,
  onDelete,
}) => {
  const basePath = `任务列表.${name}`;

  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDelete(name, basePath);
  };

  return (
    <button type="button" className={styles.questCard} onClick={onInspect}>
      <div className={styles.questCardHeader}>
        <div className={styles.questCardTitleGroup}>
          <IconTitle text={name} className={styles.questTitle} />
          <div className={styles.questBadges}>
            {quest.状态 ? <span className={styles.questStatusBadge}>{quest.状态}</span> : null}
            {quest.关注度 ? (
              <span
                className={`${styles.questPriorityBadge} ${styles[`priority${quest.关注度}`] ?? ''}`.trim()}
              >
                {quest.关注度}
              </span>
            ) : null}
          </div>
        </div>
        {editEnabled ? (
          <button
            type="button"
            className={styles.deleteButton}
            onClick={handleDeleteClick}
            title="删除任务"
          >
            <i className="fa-solid fa-trash-can" />
          </button>
        ) : null}
      </div>

      {quest.进展 ? <div className={styles.questProgress}>{quest.进展}</div> : null}

      {quest.详情 ? <div className={styles.questDetailPreview}>{quest.详情}</div> : null}

      <div className={styles.questMeta}>
        {quest.目标 ? (
          <div className={styles.questMetaRow}>
            <span className={styles.questMetaLabel}>目标</span>
            <span className={styles.questMetaValue}>{quest.目标}</span>
          </div>
        ) : null}
        {quest.奖励 ? (
          <div className={styles.questMetaRow}>
            <span className={styles.questMetaLabel}>奖励</span>
            <span className={styles.questMetaValue}>{quest.奖励}</span>
          </div>
        ) : null}
      </div>
    </button>
  );
};

interface QuestDetailContentProps {
  name: string;
  quest: Task;
  editEnabled: boolean;
}

const QuestDetailContent: FC<QuestDetailContentProps> = ({ name, quest, editEnabled }) => {
  const basePath = `任务列表.${name}`;

  const renderFieldContent = (fieldKey: QuestFieldKey) => {
    const value = quest[fieldKey] ?? '';
    const fieldPath = `${basePath}.${fieldKey}`;

    if (!editEnabled) {
      return <div className={styles.questDetailValue}>{value || '无'}</div>;
    }

    if (fieldKey === '关注度') {
      return (
        <EditableField
          path={fieldPath}
          value={value || '中'}
          type="select"
          selectConfig={{ options: PriorityOptions }}
          className={styles.questEditableField}
        />
      );
    }

    if (fieldKey === '状态') {
      return (
        <EditableField
          path={fieldPath}
          value={value}
          type="text"
          className={styles.questEditableField}
        />
      );
    }

    return (
      <EditableField
        path={fieldPath}
        value={value}
        type="textarea"
        className={styles.questEditableField}
      />
    );
  };

  return (
    <div className={styles.questDetailContent}>
      {QuestFields.map(field => (
        <section key={field.key} className={styles.questDetailSection}>
          <div className={styles.questDetailSectionTitle}>{field.label}</div>
          {renderFieldContent(field.key)}
        </section>
      ))}
    </div>
  );
};

const QuestsTabContent: FC<WithMvuDataProps> = ({ data }) => {
  const editEnabled = useEditorSettingStore(state => state.editEnabled);
  const { deleteTarget, setDeleteTarget, handleDelete, cancelDelete, isConfirmOpen } =
    useDeleteConfirm();

  const statusStorageKey = buildSessionKey('quests', 'active-status');
  const focusStorageKey = buildSessionKey('quests', 'focus-quest');

  const [activeStatus, setActiveStatus] = useState<string>(() =>
    readSessionState<string>(statusStorageKey, ALL_STATUS),
  );
  const [inspectQuest, setInspectQuest] = useState<InspectQuestState>(null);
  const [focusQuestName, setFocusQuestName] = useState<string>(() =>
    readSessionState<string>(focusStorageKey, ''),
  );

  const quests = data.任务列表 ?? {};
  const questEntries = useMemo(() => _.entries(quests) as [string, Task][], [quests]);

  const statusOptions = useMemo(() => {
    const dynamicStatuses = _.uniq(
      questEntries
        .map(([, quest]) => quest.状态?.trim())
        .filter((status): status is string => Boolean(status)),
    );

    return [ALL_STATUS, ...dynamicStatuses];
  }, [questEntries]);

  useEffect(() => {
    if (statusOptions.length === 0) return;
    if (!statusOptions.includes(activeStatus)) {
      setActiveStatus(ALL_STATUS);
    }
  }, [activeStatus, statusOptions]);

  const normalizedActiveStatus = statusOptions.includes(activeStatus) ? activeStatus : ALL_STATUS;

  const filteredQuestEntries = useMemo(() => {
    const entries =
      normalizedActiveStatus === ALL_STATUS
        ? questEntries
        : questEntries.filter(([, quest]) => (quest.状态?.trim() || '') === normalizedActiveStatus);

    return _.orderBy(
      entries,
      [([, quest]) => PriorityRankMap[quest.关注度 ?? '中'] ?? 99, ([name]) => name.toLowerCase()],
      ['asc', 'asc'],
    );
  }, [normalizedActiveStatus, questEntries]);

  const statusCountMap = useMemo(() => {
    return statusOptions.reduce<Record<string, number>>((acc, status) => {
      if (status === ALL_STATUS) {
        acc[status] = questEntries.length;
        return acc;
      }

      acc[status] = questEntries.filter(
        ([, quest]) => (quest.状态?.trim() || '') === status,
      ).length;
      return acc;
    }, {});
  }, [questEntries, statusOptions]);

  const focusQuestOptions = useMemo(() => {
    return _.orderBy(
      questEntries,
      [([, quest]) => PriorityRankMap[quest.关注度 ?? '中'] ?? 99, ([name]) => name.toLowerCase()],
      ['asc', 'asc'],
    );
  }, [questEntries]);

  const featuredQuestEntry = useMemo(() => {
    if (!focusQuestName) {
      return null;
    }

    return questEntries.find(([name]) => name === focusQuestName) ?? null;
  }, [focusQuestName, questEntries]);

  useEffect(() => {
    if (!focusQuestName) {
      writeSessionState(focusStorageKey, '');
      return;
    }

    const exists = questEntries.some(([name]) => name === focusQuestName);
    if (!exists) {
      setFocusQuestName('');
      writeSessionState(focusStorageKey, '');
      return;
    }

    writeSessionState(focusStorageKey, focusQuestName);
  }, [focusQuestName, focusStorageKey, questEntries]);

  useEffect(() => {
    writeSessionState(statusStorageKey, activeStatus);
  }, [activeStatus, statusStorageKey]);

  const handleDeleteRequest = (name: string, path: string) => {
    setDeleteTarget({ type: '任务', path, name });
  };

  const handleInspectQuest = (name: string, quest: Task) => {
    setInspectQuest({ name, quest });
  };

  const handleCloseInspect = () => {
    setInspectQuest(null);
  };

  return (
    <div className={styles.questsTab}>
      <Card className={styles.overviewCard} bodyClassName={styles.overviewCardBody}>
        <div className={styles.overviewHeader}>
          <IconTitle
            icon="fa-solid fa-list-check"
            text="任务态势"
            className={styles.overviewTitle}
            as="span"
          />
        </div>

        <div className={styles.overviewStats}>
          {statusOptions.map(status => (
            <div key={status} className={styles.overviewStatItem}>
              <span className={styles.overviewStatLabel}>{status}</span>
              <span className={styles.overviewStatValue}>{statusCountMap[status] ?? 0}</span>
            </div>
          ))}
        </div>

        <div className={styles.overviewFocus}>
          <div className={styles.overviewFocusHeader}>
            <span className={styles.overviewFocusLabel}>当前焦点</span>
            {focusQuestName ? (
              <button
                type="button"
                className={styles.focusClearButton}
                onClick={() => setFocusQuestName('')}
              >
                清空
              </button>
            ) : null}
          </div>

          {questEntries.length > 0 ? (
            <div className={styles.overviewFocusControls}>
              <label className={styles.overviewFocusSelectLabel} htmlFor="quest-focus-select">
                选择焦点任务
              </label>
              <select
                id="quest-focus-select"
                className={styles.overviewFocusSelect}
                value={focusQuestName}
                onChange={event => setFocusQuestName(event.target.value)}
              >
                <option value="">未设置</option>
                {focusQuestOptions.map(([name]) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {featuredQuestEntry ? (
            <div className={styles.overviewFocusContent}>
              <div className={styles.overviewFocusLine}>
                <span className={styles.overviewFocusLineLabel}>目标</span>
                <span className={styles.overviewFocusText}>
                  {featuredQuestEntry[1].目标 || '暂无目标'}
                </span>
              </div>
              <div className={styles.overviewFocusLine}>
                <span className={styles.overviewFocusLineLabel}>进展</span>
                <span
                  className={
                    featuredQuestEntry[1].进展
                      ? styles.overviewFocusText
                      : styles.overviewFocusTextEmpty
                  }
                >
                  {featuredQuestEntry[1].进展 || '暂无进展'}
                </span>
              </div>
            </div>
          ) : (
            <span className={styles.overviewFocusEmpty}>
              {questEntries.length === 0 ? '暂无任务焦点' : '请在上方选择一个任务作为焦点'}
            </span>
          )}
        </div>
      </Card>

      {statusOptions.length > 1 ? (
        <div className={styles.statusFilterBar}>
          {statusOptions.map(status => (
            <button
              key={status}
              type="button"
              className={`${styles.statusFilterBtn} ${normalizedActiveStatus === status ? styles.statusFilterBtnActive : ''}`}
              onClick={() => setActiveStatus(status)}
            >
              <span>{status}</span>
              <span className={styles.statusFilterCount}>{statusCountMap[status] ?? 0}</span>
            </button>
          ))}
        </div>
      ) : null}

      {filteredQuestEntries.length === 0 ? (
        <Card className={styles.emptyCard} bodyClassName={styles.emptyCardBody}>
          <EmptyHint
            className={styles.emptyHint}
            icon="fa-solid fa-scroll"
            text={
              normalizedActiveStatus === ALL_STATUS
                ? '暂无任务'
                : `暂无“${normalizedActiveStatus}”状态的任务`
            }
          />
        </Card>
      ) : (
        <div className={styles.questList}>
          {filteredQuestEntries.map(([name, quest]) => (
            <QuestSummaryCard
              key={name}
              name={name}
              quest={quest}
              editEnabled={editEnabled}
              onInspect={() => handleInspectQuest(name, quest)}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      <ItemInspectModal
        open={!!inspectQuest}
        title={inspectQuest?.name ?? ''}
        subtitle={
          inspectQuest ? (
            <div className={styles.inspectSubtitle}>
              {inspectQuest.quest.状态 ? (
                <span className={styles.questStatusBadge}>{inspectQuest.quest.状态}</span>
              ) : null}
              {inspectQuest.quest.关注度 ? (
                <span
                  className={`${styles.questPriorityBadge} ${styles[`priority${inspectQuest.quest.关注度}`] ?? ''}`.trim()}
                >
                  {inspectQuest.quest.关注度}
                </span>
              ) : null}
            </div>
          ) : null
        }
        onClose={handleCloseInspect}
      >
        {inspectQuest ? (
          <QuestDetailContent
            name={inspectQuest.name}
            quest={inspectQuest.quest}
            editEnabled={editEnabled}
          />
        ) : null}
      </ItemInspectModal>

      <DeleteConfirmModal
        open={isConfirmOpen}
        target={deleteTarget}
        onConfirm={handleDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export const QuestsTab = withMvuData({ baseClassName: styles.questsTab })(QuestsTabContent);
