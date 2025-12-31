import { FC, KeyboardEvent, useState } from 'react';
import styles from './KeyValueEditor.module.scss';

export interface KeyValueEditorProps {
  /** 当前键值对 */
  value: Record<string, string | number>;
  /** 值变更回调 */
  onChange: (value: Record<string, string | number>) => void;
  /** 键的占位符 */
  keyPlaceholder?: string;
  /** 值的占位符 */
  valuePlaceholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 值类型 */
  valueType?: 'string' | 'number';
}

/**
 * 键值对编辑器组件
 * 用于编辑效果、属性等键值对数据
 */
export const KeyValueEditor: FC<KeyValueEditorProps> = ({
  value,
  onChange,
  keyPlaceholder = '键',
  valuePlaceholder = '值',
  disabled = false,
  className,
  valueType = 'string',
}) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const handleCommit = (nextValue: Record<string, string | number>) => {
    onChange(nextValue);
  };

  const handleAdd = () => {
    const trimmedKey = newKey.trim();
    if (!trimmedKey || !newValue) return;
    if (trimmedKey in value) return; // 键已存在

    const parsedValue = valueType === 'number' ? parseFloat(newValue) || 0 : newValue;
    handleCommit({ ...value, [trimmedKey]: parsedValue });
    setNewKey('');
    setNewValue('');
  };

  const handleRemove = (keyToRemove: string) => {
    if (disabled) return;
    const newObj = { ...value };
    delete newObj[keyToRemove];
    handleCommit(newObj);
  };

  const handleStartEdit = (key: string) => {
    if (disabled) return;
    setEditingKey(key);
    setEditingValue(String(value[key]));
  };

  const handleConfirmEdit = () => {
    if (editingKey === null) return;
    const parsedValue = valueType === 'number' ? parseFloat(editingValue) || 0 : editingValue;
    handleCommit({ ...value, [editingKey]: parsedValue });
    setEditingKey(null);
    setEditingValue('');
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, action: 'add' | 'edit') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (action === 'add') {
        handleAdd();
      } else {
        handleConfirmEdit();
      }
    } else if (e.key === 'Escape') {
      if (action === 'edit') {
        handleCancelEdit();
      }
    }
  };

  const entries = Object.entries(value);

  return (
    <div
      className={`${styles.keyValueEditor} ${disabled ? styles.disabled : ''} ${className ?? ''}`}
    >
      <div className={styles.content}>
        {/* 现有条目 */}
        {entries.length > 0 && (
          <div className={styles.entries}>
            {entries.map(([key, val]) => (
              <div key={key} className={styles.entry}>
                <span className={styles.entryKey}>{key}</span>
                {editingKey === key ? (
                  <div className={styles.editWrapper}>
                    <input
                      type={valueType === 'number' ? 'number' : 'text'}
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      onKeyDown={e => handleKeyDown(e, 'edit')}
                      className={styles.editInput}
                      autoFocus
                    />
                    <button
                      className={`${styles.actionBtn} ${styles.confirmBtn}`}
                      onClick={handleConfirmEdit}
                    >
                      <i className="fa-solid fa-check" />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.cancelBtn}`}
                      onClick={handleCancelEdit}
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span
                      className={styles.entryValue}
                      onClick={() => handleStartEdit(key)}
                      title="点击编辑"
                    >
                      {val}
                    </span>
                    {!disabled && (
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemove(key)}
                        title="删除"
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 添加新条目 */}
        {!disabled && (
          <div className={styles.addRow}>
            <input
              type="text"
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'add')}
              placeholder={keyPlaceholder}
              className={styles.addInput}
            />
            <input
              type={valueType === 'number' ? 'number' : 'text'}
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'add')}
              placeholder={valuePlaceholder}
              className={styles.addInput}
            />
            <button
              className={styles.addBtn}
              onClick={handleAdd}
              disabled={!newKey.trim() || !newValue}
              title="添加"
            >
              <i className="fa-solid fa-plus" />
            </button>
          </div>
        )}

        {entries.length === 0 && disabled && <span className={styles.empty}>暂无数据</span>}
      </div>
    </div>
  );
};
