import { FC } from 'react';
import styles from './ToggleEditor.module.scss';

export interface ToggleEditorProps {
  /** 当前值 */
  value: boolean;
  /** 值变更回调 */
  onChange: (value: boolean) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 左侧文字（关闭状态提示） */
  labelOff?: string;
  /** 右侧文字（开启状态提示） */
  labelOn?: string;
  /** 尺寸 */
  size?: 'sm' | 'md';
}

/**
 * 布尔开关编辑器
 * 支持左右状态文字提示，适合"是否在场"、"是否契约"等场景
 */
export const ToggleEditor: FC<ToggleEditorProps> = ({
  value,
  onChange,
  disabled = false,
  className,
  labelOff,
  labelOn,
  size = 'md',
}) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!value);
    }
  };

  return (
    <div
      className={`${styles.toggleEditor} ${disabled ? styles.disabled : ''} ${styles[size]} ${className ?? ''}`}
    >
      {labelOff && (
        <span
          className={`${styles.labelText} ${styles.labelOff} ${!value ? styles.active : ''}`}
          onClick={handleClick}
        >
          {labelOff}
        </span>
      )}
      <button
        type="button"
        className={`${styles.toggle} ${value ? styles.isOn : ''}`}
        onClick={handleClick}
        aria-pressed={value}
        disabled={disabled}
      >
        <span className={styles.thumb} />
      </button>
      {labelOn && (
        <span
          className={`${styles.labelText} ${styles.labelOn} ${value ? styles.active : ''}`}
          onClick={handleClick}
        >
          {labelOn}
        </span>
      )}
    </div>
  );
};
