import { FC } from 'react';
import type { Task } from '../../core/types';
import { Card, Collapse, EmptyHint, IconTitle } from '../../shared/components';
import { withMvuData, WithMvuDataProps } from '../../shared/hoc';
import styles from './QuestsTab.module.scss';

/**
 * 任务页内容组件
 * 显示当前进行中的任务列表（任务完成后会从列表移除）
 */
const QuestsTabContent: FC<WithMvuDataProps> = ({ data }) => {
  const quests = data.任务列表 ?? {};
  const questEntries = _.entries(quests) as [string, Task][];

  /** 渲染单个任务 */
  const renderQuest = (name: string, quest: Task) => (
    <Collapse key={name} title={<IconTitle text={name} className={styles.questTitle} />}>
      <div className={styles.questContent}>
        {/* 简介 */}
        {quest.简介 && (
          <div className={styles.questField}>
            <span className={styles.fieldLabel}>简介</span>
            <p className={styles.fieldValue}>{quest.简介}</p>
          </div>
        )}

        {/* 目标 */}
        {quest.目标 && (
          <div className={styles.questField}>
            <span className={styles.fieldLabel}>目标</span>
            <p className={styles.fieldValue}>{quest.目标}</p>
          </div>
        )}

        {/* 奖励 */}
        {quest.奖励 && (
          <div className={styles.questField}>
            <span className={styles.fieldLabel}>奖励</span>
            <p className={styles.fieldValue}>{quest.奖励}</p>
          </div>
        )}
      </div>
    </Collapse>
  );

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
          {questEntries.map(([name, quest]) => renderQuest(name, quest))}
        </div>
      )}
    </div>
  );
};

/**
 * 任务页组件（使用 HOC 包装）
 */
export const QuestsTab = withMvuData({ baseClassName: styles.questsTab })(QuestsTabContent);
