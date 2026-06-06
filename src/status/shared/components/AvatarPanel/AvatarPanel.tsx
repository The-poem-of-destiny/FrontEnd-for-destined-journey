import { FC, MouseEventHandler } from 'react';
import styles from './AvatarPanel.module.scss';

export type AvatarPanelSize = 'sm' | 'md' | 'lg';

export interface AvatarPanelProps {
  /** 头像地址；为空时展示占位 */
  src?: string;
  /** 图片替代文本 */
  alt: string;
  /** 尺寸规格 */
  size?: AvatarPanelSize;
  /** 图片加载失败 */
  onImageError?: () => void;
  /** 点击头像 */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** 自定义类名 */
  className?: string;
}

const DefaultAvatarSrc = `https://testingcf.jsdelivr.net/gh/The-poem-of-destiny/FrontEnd-for-destined-journey@${__APP_VERSION__}/public/images/avatar.png`;

const SizeClassMap: Record<AvatarPanelSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

/**
 * 通用头像面板组件
 */
export const AvatarPanel: FC<AvatarPanelProps> = ({
  src,
  alt,
  size = 'md',
  onImageError,
  onClick,
  className = '',
}) => {
  const displaySrc = src || DefaultAvatarSrc;

  return (
    <div className={`${styles.avatarPanel} ${SizeClassMap[size]} ${className}`.trim()}>
      <button
        type="button"
        className={styles.imageButton}
        onClick={onClick}
        aria-label={alt}
        title={alt}
      >
        <div className={styles.imageShell}>
          <img
            className={styles.image}
            src={displaySrc}
            alt={alt}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            onError={onImageError}
          />
        </div>
      </button>
    </div>
  );
};
