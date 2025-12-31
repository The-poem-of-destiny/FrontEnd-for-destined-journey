import { ChangeEvent, FC } from 'react';
import styles from './SelectEditor.module.scss';

export interface SelectEditorOption {
  label: string;
  value: string;
}

export interface SelectEditorProps {
  /** 当前值 */
  value: string;
  /** 值变更回调 */
  onChange: (value: string) => void;
  /** 选项列表 */
  options: SelectEditorOption[];
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 枚举选择编辑器
 */
export const SelectEditor: FC<SelectEditorProps> = ({
  value,
  onChange,
  options,
  disabled = false,
  className,
}) => {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`${styles.selectEditor} ${disabled ? styles.disabled : ''} ${className ?? ''}`}>
      <div className={styles.selectWrapper}>
        <select value={value} onChange={handleChange} disabled={disabled} className={styles.select}>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <i className={`fa-solid fa-angle-down ${styles.icon}`} />
      </div>
    </div>
  );
};
