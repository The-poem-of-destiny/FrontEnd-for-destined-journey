import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';
import styles from './TextEditor.module.scss';

export interface TextEditorProps {
  /** 当前值 */
  value: string;
  /** 值变更回调 */
  onChange: (value: string) => void;
  /** 占位符 */
  placeholder?: string;
  /** 是否多行 */
  multiline?: boolean;
  /** 多行时的行数 */
  rows?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 最大长度 */
  maxLength?: number;
  /** 自定义类名 */
  className?: string;
  /** 编辑模式：inline 行内编辑，modal 弹窗编辑 */
  mode?: 'inline' | 'modal';
}

/**
 * 文本编辑器组件
 * 支持单行/多行文本编辑
 */
export const TextEditor: FC<TextEditorProps> = ({
  value,
  onChange,
  placeholder = '请输入...',
  multiline = false,
  rows = 3,
  disabled = false,
  maxLength,
  className,
  mode = 'inline',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // 同步外部值
  useEffect(() => {
    if (!isEditing) {
      setTempValue(value);
    }
  }, [value, isEditing]);

  // 自动聚焦
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setTempValue(value);
  };

  const handleCommit = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleBlur = () => {
    if (!disabled) {
      handleCommit();
    }
  };

  const displayValue = value || placeholder;

  if (mode === 'inline' && !isEditing) {
    return (
      <div
        className={`${styles.textEditor} ${styles.displayMode} ${disabled ? styles.disabled : ''} ${className ?? ''}`}
        onClick={handleStartEdit}
        title={disabled ? '不可编辑' : '点击编辑'}
      >
        <span className={`${styles.displayValue} ${!value ? styles.placeholder : ''}`}>
          {displayValue}
        </span>
        {!disabled && <i className={`fa-solid fa-pen ${styles.editIcon}`} />}
      </div>
    );
  }

  const inputProps = {
    ref: inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>,
    value: tempValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setTempValue(e.target.value),
    onKeyDown: handleKeyDown,
    onBlur: handleBlur,
    placeholder,
    disabled,
    maxLength,
    className: styles.input,
  };

  return (
    <div className={`${styles.textEditor} ${styles.editMode} ${className ?? ''}`}>
      <div className={styles.inputWrapper}>
        {multiline ? (
          <textarea {...inputProps} rows={rows} />
        ) : (
          <input type="text" {...inputProps} />
        )}
      </div>
    </div>
  );
};
