import { FC } from 'react';
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
  onClick?: () => void;
  /** 是否展示编辑提示按钮 */
  showEditHint?: boolean;
  /** 无头像时的占位文本 */
  placeholderText?: string;
  /** 自定义类名 */
  className?: string;
}

const SizeClassMap: Record<AvatarPanelSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

const PlaceholderToneClassNames = [
  styles.placeholderToneA,
  styles.placeholderToneB,
  styles.placeholderToneC,
  styles.placeholderToneD,
  styles.placeholderToneE,
  styles.placeholderToneF,
];

const getAvatarPlaceholder = (placeholder_text: string, alt: string) => {
  const normalizedText = _.trim(placeholder_text || alt || '？');
  return normalizedText.charAt(0).toUpperCase() || '？';
};

const getPlaceholderToneClassName = (placeholder_text: string) => {
  const normalizedText = _.trim(placeholder_text || '？');
  const hashValue = Array.from(normalizedText).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return PlaceholderToneClassNames[hashValue % PlaceholderToneClassNames.length];
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
  showEditHint = false,
  placeholderText = '',
  className = '',
}) => {
  const placeholder = getAvatarPlaceholder(placeholderText, alt);
  const placeholderToneClassName = getPlaceholderToneClassName(placeholderText || alt);

  return (
    <div className={`${styles.avatarPanel} ${SizeClassMap[size]} ${className}`.trim()}>
      <button
        type="button"
        className={styles.imageButton}
        onClick={onClick}
        aria-label={alt}
        title={alt}
      >
        <div
          className={`${styles.imageShell} ${src ? styles.imageShellFilled : `${styles.imageShellEmpty} ${placeholderToneClassName}`}`}
        >
          {src ? (
            <img className={styles.image} src={src} alt={alt} onError={onImageError} />
          ) : (
            <span className={styles.placeholderText}>{placeholder}</span>
          )}
        </div>
      </button>

      {showEditHint ? (
        <span className={styles.editHintButton} aria-hidden="true">
          <i className="fa-solid fa-pen" />
        </span>
      ) : null}
    </div>
  );
};
