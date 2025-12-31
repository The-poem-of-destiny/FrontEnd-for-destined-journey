import { FC, ReactNode, useCallback } from 'react';
import styles from './ConfirmModal.module.scss';

/** 确认弹窗信息行配置 */
export interface ConfirmModalRow {
  /** 行标签 */
  label: string;
  /** 行值 */
  value: ReactNode;
}

/** 按钮类型 */
export type ConfirmButtonVariant = 'primary' | 'danger' | 'secondary';

/** 按钮配置 */
export interface ConfirmModalButton {
  /** 按钮文本 */
  text: string;
  /** 按钮类型 */
  variant?: ConfirmButtonVariant;
  /** 点击回调 */
  onClick: () => void;
  /** 是否禁用 */
  disabled?: boolean;
}

export interface ConfirmModalProps {
  /** 是否显示 */
  open: boolean;
  /** 弹窗标题 */
  title: string;
  /** 信息行列表（简单的标签-值对展示） */
  rows?: ConfirmModalRow[];
  /** 自定义内容（优先于 rows，更灵活的内容区域） */
  children?: ReactNode;
  /** 按钮配置列表 */
  buttons?: ConfirmModalButton[];
  /** 点击遮罩关闭回调 */
  onClose?: () => void;
  /** 是否允许点击遮罩关闭，默认 true */
  closeOnOverlay?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 通用确认弹窗组件
 * 支持信息行展示和自定义内容
 */
export const ConfirmModal: FC<ConfirmModalProps> = ({
  open,
  title,
  rows,
  children,
  buttons,
  onClose,
  closeOnOverlay = true,
  className,
}) => {
  /** 处理遮罩点击 */
  const handleOverlayClick = useCallback(() => {
    if (closeOnOverlay && onClose) {
      onClose();
    }
  }, [closeOnOverlay, onClose]);

  /** 阻止弹窗内部点击冒泡 */
  const handleModalClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  /** 获取按钮样式类名 */
  const getButtonClass = (variant: ConfirmButtonVariant = 'primary') => {
    switch (variant) {
      case 'danger':
        return styles.btnDanger;
      case 'secondary':
        return styles.btnSecondary;
      case 'primary':
      default:
        return styles.btnPrimary;
    }
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={`${styles.modal} ${className ?? ''}`} onClick={handleModalClick}>
        <div className={styles.title}>{title}</div>

        {/* 自定义内容区域 */}
        {children && <div className={styles.content}>{children}</div>}

        {/* 信息行展示 */}
        {!children && rows && rows.length > 0 && (
          <div className={styles.body}>
            {rows.map((row, index) => (
              <div key={index} className={styles.row}>
                <span className={styles.label}>{row.label}</span>
                <span className={styles.value}>{row.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* 按钮区域 */}
        {buttons && buttons.length > 0 && (
          <div className={styles.actions}>
            {buttons.map((btn, index) => (
              <button
                key={index}
                className={getButtonClass(btn.variant)}
                onClick={btn.onClick}
                disabled={btn.disabled}
              >
                {btn.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
