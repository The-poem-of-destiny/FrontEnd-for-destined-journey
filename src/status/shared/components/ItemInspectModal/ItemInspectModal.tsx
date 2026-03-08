import { FC, ReactNode, useCallback, useEffect } from 'react';
import styles from './ItemInspectModal.module.scss';

export interface ItemInspectModalProps {
  /** 是否显示 */
  open: boolean;
  /** 标题 */
  title: string;
  /** 副标题 */
  subtitle?: ReactNode;
  /** 内容 */
  children: ReactNode;
  /** 关闭回调 */
  onClose?: () => void;
  /** 是否允许点击遮罩关闭 */
  closeOnOverlay?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 将 iframe 滚动到父页面视觉中央
 * 复用确认弹窗相同的交互基线，避免中上部触发时详情面板超出用户视线焦点。
 */
const scrollToIframeCenter = () => {
  const frameElement = window.frameElement;
  if (frameElement) {
    frameElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

/**
 * 资产详情中央面板
 * 用于承载 ItemsTab 的二级详情信息，不依赖底部抽屉或折叠面板。
 */
export const ItemInspectModal: FC<ItemInspectModalProps> = ({
  open,
  title,
  subtitle,
  children,
  onClose,
  closeOnOverlay = true,
  className,
}) => {
  useEffect(() => {
    if (!open) return;

    scrollToIframeCenter();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!closeOnOverlay) {
        return;
      }

      if (event.target === event.currentTarget) {
        onClose?.();
      }
    },
    [closeOnOverlay, onClose],
  );

  const handlePanelClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  }, []);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={`${styles.modal} ${className ?? ''}`.trim()} onClick={handlePanelClick}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <div className={styles.title}>{title}</div>
            {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} title="关闭详情">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
};
