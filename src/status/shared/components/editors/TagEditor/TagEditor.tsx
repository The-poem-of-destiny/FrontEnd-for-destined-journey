import { FC, KeyboardEvent, useRef, useState } from 'react';
import styles from './TagEditor.module.scss';

export interface TagEditorProps {
  /** 当前标签列表 */
  value: string[];
  /** 值变更回调 */
  onChange: (value: string[]) => void;
  /** 占位符 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 最大标签数 */
  maxTags?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 标签编辑器组件
 * 支持添加、删除标签
 */
export const TagEditor: FC<TagEditorProps> = ({
  value,
  onChange,
  placeholder = '添加标签...',
  disabled = false,
  maxTags,
  className,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCommit = (nextValue: string[]) => {
    onChange(nextValue);
  };

  const handleAddTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setInputValue('');
      return;
    }
    if (maxTags && value.length >= maxTags) return;

    handleCommit([...value, trimmed]);
    setInputValue('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (disabled) return;
    handleCommit(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // 输入框为空时，Backspace 删除最后一个标签
      handleRemoveTag(value[value.length - 1]);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      handleAddTag();
    }
    setIsEditing(false);
  };

  const canAddMore = !maxTags || value.length < maxTags;

  return (
    <div className={`${styles.tagEditor} ${disabled ? styles.disabled : ''} ${className ?? ''}`}>
      <div className={styles.tagsContainer}>
        {value.map((tag, idx) => (
          <span key={idx} className={styles.tag}>
            {tag}
            {!disabled && (
              <button
                className={styles.removeBtn}
                onClick={() => handleRemoveTag(tag)}
                title="移除标签"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </span>
        ))}
        {!disabled &&
          canAddMore &&
          (isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={placeholder}
              className={styles.input}
            />
          ) : (
            <button className={styles.addBtn} onClick={handleStartEdit} title="添加标签">
              <i className="fa-solid fa-plus" />
            </button>
          ))}
      </div>
    </div>
  );
};
