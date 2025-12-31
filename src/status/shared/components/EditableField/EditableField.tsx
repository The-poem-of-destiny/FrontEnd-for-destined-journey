import { FC, useCallback, useMemo, useState } from 'react';
import { useEditorSettingStore, useMvuDataStore } from '../../../core/stores';
import type { ConfirmModalRow } from '../ConfirmModal';
import { ConfirmModal } from '../ConfirmModal';
import type { SelectEditorOption } from '../editors';
import {
  KeyValueEditor,
  NumberEditor,
  RecordListEditor,
  SelectEditor,
  TagEditor,
  TextEditor,
  ToggleEditor,
} from '../editors';
import styles from './EditableField.module.scss';

/** 字段类型 */
type FieldType =
  | 'text'
  | 'number'
  | 'tags'
  | 'keyvalue'
  | 'textarea'
  | 'select'
  | 'toggle'
  | 'record';

export interface EditableFieldProps {
  /** 数据路径 (相对于 stat_data) */
  path: string;
  /** 当前值 */
  value: unknown;
  /** 字段类型 */
  type?: FieldType;
  /** 标签 */
  label?: string;
  /** 是否可删除 */
  deletable?: boolean;
  /** 删除确认文本 */
  deleteConfirmText?: string;
  /** 是否禁用 */
  disabled?: boolean;
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
  /** 列表编辑器配置 */
  recordConfig?: {
    emptyText?: string;
    renderItem: (key: string, item: unknown) => React.ReactNode;
  };
  /** 更新成功回调 */
  onUpdateSuccess?: () => void;
  /** 删除成功回调 */
  onDeleteSuccess?: () => void;
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
  deletable = false,
  deleteConfirmText,
  disabled = false,
  className,
  numberConfig,
  keyValueConfig,
  selectConfig,
  toggleConfig,
  recordConfig,
  onUpdateSuccess,
  onDeleteSuccess,
}) => {
  const { updateField, deleteField } = useMvuDataStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [pendingValue, setPendingValue] = useState<unknown | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string>('');
  const [pendingPrevValue, setPendingPrevValue] = useState<unknown | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { editEnabled } = useEditorSettingStore();
  const isDisabled = disabled || !editEnabled;

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

  /** 处理删除 */
  const handleDelete = useCallback(async () => {
    if (deleteConfirmText) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    const success = await deleteField(path);
    setIsDeleting(false);

    if (success) {
      toastr.success('已删除');
      onDeleteSuccess?.();
    } else {
      toastr.error('删除失败');
    }
  }, [path, deleteField, deleteConfirmText, onDeleteSuccess]);

  /** 确认删除 */
  const confirmDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    const success = await deleteField(path);
    setIsDeleting(false);

    if (success) {
      toastr.success('已删除');
      onDeleteSuccess?.();
    } else {
      toastr.error('删除失败');
    }
  }, [path, deleteField, onDeleteSuccess]);

  /** 取消删除 */
  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
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

      case 'record':
        return (
          <RecordListEditor
            value={(value as Record<string, unknown>) ?? {}}
            renderItem={recordConfig?.renderItem ?? (() => null)}
            emptyText={recordConfig?.emptyText}
            disabled={isDisabled}
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

      {deletable && !isDisabled && (
        <div className={styles.deleteWrapper}>
          {showDeleteConfirm ? (
            <div className={styles.confirmDialog}>
              <span className={styles.confirmText}>{deleteConfirmText}</span>
              <button
                className={`${styles.confirmBtn} ${styles.yesBtn}`}
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                确认
              </button>
              <button className={`${styles.confirmBtn} ${styles.noBtn}`} onClick={cancelDelete}>
                取消
              </button>
            </div>
          ) : (
            <button
              className={styles.deleteBtn}
              onClick={handleDelete}
              disabled={isDeleting}
              title="删除"
            >
              <i className={`fa-solid fa-trash ${isDeleting ? 'fa-spin' : ''}`} />
            </button>
          )}
        </div>
      )}

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
