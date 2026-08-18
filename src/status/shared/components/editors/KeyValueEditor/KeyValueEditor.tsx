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

  /** 确认编辑（失焦或按键触发） */
  const handleConfirmEdit = () => {
    if (editingKey === null) return;
    const parsedValue = valueType === 'number' ? parseFloat(editingValue) || 0 : editingValue;
    handleCommit({ ...value, [editingKey]: parsedValue });
    setEditingKey(null);
    setEditingValue('');
  };

  /** 取消编辑（Escape 触发） */
  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingValue('');
  };

  /** 失焦时自动保存（与其他编辑器行为一致） */
  const handleBlur = () => {
    if (!disabled) {
      handleConfirmEdit();
    }
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    action: 'add' | 'edit',
  ) => {
    // Ctrl+Enter 或 Cmd+Enter 提交
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
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
                    {valueType === 'number' ? (
                      <input
                        type="number"
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        onKeyDown={e => handleKeyDown(e, 'edit')}
                        onBlur={handleBlur}
                        className={styles.editInput}
                        autoFocus
                      />
                    ) : (
                      <textarea
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        onKeyDown={e => handleKeyDown(e, 'edit')}
                        onBlur={handleBlur}
                        className={styles.editTextarea}
                        rows={3}
                        autoFocus
                        placeholder="失焦自动保存 · Esc 取消"
                      />
                    )}
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
                        <i className="fa-solid fa-trash-can" />
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
            {valueType === 'number' ? (
              <input
                type="number"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                onKeyDown={e => handleKeyDown(e, 'add')}
                placeholder={valuePlaceholder}
                className={styles.addInput}
              />
            ) : (
              <textarea
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                onKeyDown={e => handleKeyDown(e, 'add')}
                placeholder={`${valuePlaceholder} (Ctrl+Enter 添加)`}
                className={styles.addTextarea}
                rows={2}
              />
            )}
            <button
              className={styles.addBtn}
              onClick={handleAdd}
              disabled={!newKey.trim() || !newValue}
              title="添加 (Ctrl+Enter)"
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
