import { FC } from 'react';
import { Collapse } from '../../Collapse/Collapse';
import { EmptyHint } from '../../EmptyHint/EmptyHint';
import styles from './RecordListEditor.module.scss';

export interface RecordListEditorProps {
  /** 记录对象 */
  value: Record<string, unknown>;
  /** 渲染条目内容 */
  renderItem: (key: string, item: unknown) => React.ReactNode;
  /** 空态文案 */
  emptyText?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 记录型对象列表编辑器（以 Collapse 展示）
 */
export const RecordListEditor: FC<RecordListEditorProps> = ({
  value,
  renderItem,
  emptyText = '暂无数据',
  disabled = false,
  className,
}) => {
  const entries = Object.entries(value ?? {});

  return (
    <div
      className={`${styles.recordListEditor} ${disabled ? styles.disabled : ''} ${className ?? ''}`}
    >
      <div className={styles.list}>
        {entries.length === 0 ? (
          <EmptyHint className={styles.empty} text={emptyText} />
        ) : (
          entries.map(([key, item]) => (
            <Collapse key={key} title={key} className={styles.itemCollapse}>
              {renderItem(key, item)}
            </Collapse>
          ))
        )}
      </div>
    </div>
  );
};
