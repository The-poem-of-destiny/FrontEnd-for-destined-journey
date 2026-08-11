import { FC, useCallback, useMemo, useState } from 'react';
import { useEditorSettingStore, useMvuDataStore } from '../../../core/stores';
import type { ConfirmModalRow } from '../ConfirmModal';
import { ConfirmModal } from '../ConfirmModal';
import type { SelectEditorOption } from '../editors';
import {
  KeyValueEditor,
  NumberEditor,
  SelectEditor,
  TagEditor,
  TextEditor,
  ToggleEditor,
} from '../editors';
import styles from './EditableField.module.scss';

/** 字段类型 */
type FieldType = 'text' | 'number' | 'tags' | 'keyvalue' | 'textarea' | 'select' | 'toggle';

export interface EditableFieldProps {
  /** 数据路径 (相对于 stat_data) */
  path: string;
  /** 当前值 */
  value: unknown;
  /** 字段类型 */
  type?: FieldType;
  /** 标签 */
  label?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 绕过编辑模式锁：未开启"允许编辑数据"时也可编辑（仍走确认弹窗） */
  bypassEditGuard?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 数字编辑器配置 */
  numberConfig?: {
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
  };
  /** 键值对编辑器配置 */
  keyValueConfig?: {
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    valueType?: 'string' | 'number';
  };
  /** 选择器配置 */
  selectConfig?: {
    options: SelectEditorOption[];
  };
  /** 开关编辑器配置 */
  toggleConfig?: {
    /** 关闭状态文字 */
    labelOff?: string;
    /** 开启状态文字 */
    labelOn?: string;
    /** 尺寸 */
    size?: 'sm' | 'md';
  };
  /** 更新成功回调 */
  onUpdateSuccess?: () => void;
}

/**
 * 可编辑字段组件
 * 根据字段类型自动选择编辑器，集成 RUD 操作
 */
export const EditableField: FC<EditableFieldProps> = ({
  path,
  value,
  type = 'text',
  label,
  disabled = false,
  bypassEditGuard = false,
  className,
  numberConfig,
  keyValueConfig,
  selectConfig,
  toggleConfig,
  onUpdateSuccess,
}) => {
  const { updateField } = useMvuDataStore();

  const [pendingValue, setPendingValue] = useState<unknown | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string>('');
  const [pendingPrevValue, setPendingPrevValue] = useState<unknown | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { editEnabled } = useEditorSettingStore();
  const isDisabled = disabled || (!bypassEditGuard && !editEnabled);

  const formattedCurrentValue = useMemo(() => value, [value]);

  const formatValue = (target: unknown) => {
    // 格式化值用于确认弹窗显示
    if (target === null || target === undefined) return '空';
    if (typeof target === 'string') return target;
    if (typeof target === 'number' || typeof target === 'boolean') return String(target);
    try {
      return JSON.stringify(target);
    } catch {
      return String(target);
    }
  };

  /** 进入确认状态 */
  const handleChange = useCallback(
    (newVal: unknown) => {
      if (isDisabled) return;
      // 避免无变化时弹窗
      if (_.isEqual(newVal, formattedCurrentValue)) return;
      setPendingValue(newVal);
      setPendingPrevValue(formattedCurrentValue);
      setPendingLabel(label ?? path);
      setShowConfirm(true);
    },
    [isDisabled, formattedCurrentValue, label, path],
  );

  /** 确认提交 */
  const confirmUpdate = useCallback(async () => {
    if (!showConfirm) return;
    const success = await updateField(path, pendingValue);
    setShowConfirm(false);
    setPendingValue(null);
    setPendingPrevValue(null);

    if (success) {
      toastr.success('已保存');
      onUpdateSuccess?.();
    } else {
      toastr.error('保存失败');
    }
  }, [showConfirm, updateField, path, pendingValue, onUpdateSuccess]);

  /** 取消提交 */
  const cancelUpdate = useCallback(() => {
    setShowConfirm(false);
    setPendingValue(null);
    setPendingPrevValue(null);
  }, []);

  /** 渲染编辑器 */
  const renderEditor = () => {
    switch (type) {
      case 'number':
        return (
          <NumberEditor
            value={typeof value === 'number' ? value : 0}
            onChange={handleChange}
            disabled={isDisabled}
            {...numberConfig}
          />
        );

      case 'tags':
        return (
          <TagEditor
            value={Array.isArray(value) ? value : []}
            onChange={handleChange}
            disabled={isDisabled}
          />
        );

      case 'keyvalue':
        return (
          <KeyValueEditor
            value={
              typeof value === 'object' && value !== null
                ? (value as Record<string, string | number>)
                : {}
            }
            onChange={handleChange}
            disabled={isDisabled}
            {...keyValueConfig}
          />
        );

      case 'textarea':
        return (
          <TextEditor
            value={typeof value === 'string' ? value : String(value ?? '')}
            onChange={handleChange}
            disabled={isDisabled}
            multiline
            rows={3}
          />
        );

      case 'select':
        return (
          <SelectEditor
            value={String(value ?? '')}
            onChange={handleChange}
            options={selectConfig?.options ?? []}
            disabled={isDisabled}
          />
        );

      case 'toggle':
        return (
          <ToggleEditor
            value={Boolean(value)}
            onChange={handleChange}
            disabled={isDisabled}
            {...toggleConfig}
          />
        );

      case 'text':
      default:
        return (
          <TextEditor
            value={typeof value === 'string' ? value : String(value ?? '')}
            onChange={handleChange}
            disabled={isDisabled}
          />
        );
    }
  };

  return (
    <div className={`${styles.editableField} ${className ?? ''}`}>
      <div className={styles.editorWrapper}>{renderEditor()}</div>

      <ConfirmModal
        open={showConfirm}
        title="确认修改"
        rows={
          [
            { label: '字段', value: pendingLabel },
            { label: '旧值', value: formatValue(pendingPrevValue) },
            { label: '新值', value: formatValue(pendingValue) },
          ] as ConfirmModalRow[]
        }
        buttons={[
          { text: '确认', variant: 'primary', onClick: confirmUpdate },
          { text: '取消', variant: 'secondary', onClick: cancelUpdate },
        ]}
        onClose={cancelUpdate}
      />
    </div>
  );
};
