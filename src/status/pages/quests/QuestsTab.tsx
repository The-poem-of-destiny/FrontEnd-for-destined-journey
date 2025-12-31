import { FC, useState } from 'react';
import { useEditorSettingStore, useMvuDataStore } from '../../core/stores';
import type { Task } from '../../core/types';
import {
  Card,
  Collapse,
  ConfirmModal,
  EditableField,
  EmptyHint,
  IconTitle,
} from '../../shared/components';
import { withMvuData, WithMvuDataProps } from '../../shared/hoc';
import styles from './QuestsTab.module.scss';

/** 任务字段配置 */
const QuestFields = [
  { key: '简介', label: '简介', type: 'textarea' as const },
  { key: '目标', label: '目标', type: 'textarea' as const },
  { key: '奖励', label: '奖励', type: 'textarea' as const },
] as const;

/**
 * 单个任务卡片组件
 */
const QuestCard: FC<{ name: string; quest: Task }> = ({ name, quest }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { deleteField } = useMvuDataStore();
  const { editEnabled } = useEditorSettingStore();

  const basePath = `任务列表.${name}`;

  /** 点击删除按钮 */
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  /** 确认删除 */
  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    const success = await deleteField(basePath);
    if (success) {
      toastr.success('已删除');
    } else {
      toastr.error('删除失败');
    }
  };

  return (
    <>
      <Collapse
        title={
          <div className={styles.questHeader}>
            <IconTitle text={name} className={styles.questTitle} />
            {editEnabled && (
              <button className={styles.deleteButton} onClick={handleDeleteClick} title="删除">
                <i className="fa-solid fa-trash-can" />
              </button>
            )}
          </div>
        }
      >
        <div className={styles.questContent}>
          {QuestFields.map(field => {
            const fieldValue = quest[field.key as keyof Task];
            const fieldPath = `${basePath}.${field.key}`;

            return (
              <div key={field.key} className={styles.questField}>
                <span className={styles.fieldLabel}>{field.label}</span>
                <div className={styles.fieldValue}>
                  <EditableField
                    path={fieldPath}
                    value={fieldValue ?? ''}
                    type={field.type}
                    label={`${name} - ${field.label}`}
                    className={styles.editableContent}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Collapse>

      {/* 删除确认弹窗 */}
      <ConfirmModal
        open={showDeleteConfirm}
        title="确认删除"
        rows={[{ label: '操作', value: `确定要删除任务「${name}」吗？此操作不可撤销。` }]}
        buttons={[
          { text: '删除', variant: 'danger', onClick: handleConfirmDelete },
          { text: '取消', variant: 'secondary', onClick: () => setShowDeleteConfirm(false) },
        ]}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};

/**
 * 任务页内容组件
 * 显示当前进行中的任务列表（任务完成后会从列表移除）
 */
const QuestsTabContent: FC<WithMvuDataProps> = ({ data }) => {
  const quests = data.任务列表 ?? {};
  const questEntries = _.entries(quests) as [string, Task][];

  return (
    <div className={styles.questsTab}>
      {/* 任务统计 */}
      <Card className={styles.statsCard}>
        <div className={styles.stats}>
          <IconTitle
            icon="fa-solid fa-list-check"
            text="进行中"
            className={styles.statsLabel}
            as="span"
          />
          <span className={styles.statsValue}>{questEntries.length}</span>
        </div>
      </Card>

      {/* 任务列表 */}
      {questEntries.length === 0 ? (
        <Card className={styles.emptyCard}>
          <EmptyHint
            className={styles.emptyHint}
            icon="fa-solid fa-scroll"
            text="暂无进行中的任务"
          />
        </Card>
      ) : (
        <div className={styles.questList}>
          {questEntries.map(([name, quest]) => (
            <QuestCard key={name} name={name} quest={quest} />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * 任务页组件（使用 HOC 包装）
 */
export const QuestsTab = withMvuData({ baseClassName: styles.questsTab })(QuestsTabContent);
