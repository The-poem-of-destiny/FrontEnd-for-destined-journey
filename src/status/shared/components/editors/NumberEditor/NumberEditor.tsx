import { FC, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import styles from './NumberEditor.module.scss';

export interface NumberEditorProps {
  /** 当前值 */
  value: number;
  /** 值变更回调 */
  onChange: (value: number) => void;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 步进值 */
  step?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 后缀（如单位） */
  suffix?: string;
  /** 是否显示增减按钮 */
  showButtons?: boolean;
}

/**
 * 数字编辑器组件
 * 支持步进调整和直接输入
 */
export const NumberEditor: FC<NumberEditorProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  className,
  suffix,
  showButtons = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(String(value));
  // 步进期间仅更新展示值，不切换到输入态
  const [isStepping, setIsStepping] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const tempValueRef = useRef(tempValue);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  // 同步引用
  useEffect(() => {
    tempValueRef.current = tempValue;
  }, [tempValue]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // 同步外部值（步进中不覆盖临时值）
  useEffect(() => {
    if (!isEditing && !isStepping) {
      setTempValue(String(value));
      setIsStepping(false);
    }
  }, [value, isEditing, isStepping]);

  // 自动聚焦
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  /** 限制值在范围内 */
  const clampValue = (val: number): number => {
    let clamped = val;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    return clamped;
  };

  const getNextStepValue = (delta: number) => {
    // 步进期间继续使用临时值作为基准
    const baseValue = isEditing || isStepping ? parseFloat(tempValue) || value : value;
    return clampValue(baseValue + delta);
  };

  const handleStartEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setTempValue(String(value));
  };

  const handleCommit = useCallback(() => {
    const currentTempValue = tempValueRef.current;
    const currentValue = valueRef.current;

    if (currentTempValue === String(currentValue)) {
      setIsEditing(false);
      setIsStepping(false);
      return;
    }

    const parsed = parseFloat(currentTempValue);
    if (!isNaN(parsed)) {
      onChangeRef.current(clampValue(parsed));
    }
    setIsEditing(false);
    setIsStepping(false);
  }, []);

  // 步进操作防抖：停止 1s 后触发确认
  const debouncedCommitRef = useRef(_.debounce((commitFn: () => void) => commitFn(), 1000));

  useEffect(() => {
    // 卸载或重新生成时取消防抖提交
    return () => {
      debouncedCommitRef.current.cancel();
    };
  }, []);

  const handleCancel = () => {
    setTempValue(String(value));
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleBlur = () => {
    // 失焦时立即提交并取消防抖
    debouncedCommitRef.current.cancel();
    if (!disabled) {
      handleCommit();
    }
  };

  const handleIncrement = () => {
    if (disabled) return;
    // 步进按钮连续改值，停止操作后再触发确认
    const nextValue = getNextStepValue(step);
    setTempValue(String(nextValue));
    setIsStepping(true);
    debouncedCommitRef.current(handleCommit);
  };

  const handleDecrement = () => {
    if (disabled) return;
    // 步进按钮连续改值，停止操作后再触发确认
    const nextValue = getNextStepValue(-step);
    setTempValue(String(nextValue));
    setIsStepping(true);
    debouncedCommitRef.current(handleCommit);
  };

  if (isEditing) {
    return (
      <div className={`${styles.numberEditor} ${styles.editMode} ${className ?? ''}`}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="number"
            value={tempValue}
            onChange={e => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            min={min}
            max={max}
            step={step}
            className={styles.input}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.numberEditor} ${styles.displayMode} ${disabled ? styles.disabled : ''} ${className ?? ''}`}
    >
      <div className={styles.valueWrapper}>
        {showButtons && (
          <button
            className={styles.stepBtn}
            onClick={handleDecrement}
            disabled={disabled || (min !== undefined && value <= min)}
            title="减少"
          >
            <i className="fa-solid fa-minus" />
          </button>
        )}
        <span
          className={styles.displayValue}
          onClick={handleStartEdit}
          title={disabled ? '不可编辑' : '点击编辑'}
        >
          {isStepping ? tempValue : value}
          {suffix && <span className={styles.suffix}>{suffix}</span>}
        </span>
        {showButtons && (
          <button
            className={styles.stepBtn}
            onClick={handleIncrement}
            disabled={disabled || (max !== undefined && value >= max)}
            title="增加"
          >
            <i className="fa-solid fa-plus" />
          </button>
        )}
      </div>
    </div>
  );
};
