import { FC, ReactNode, useState } from 'react';
import styles from './Collapse.module.scss';

export interface CollapseProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  quality?: string;
}

// 品质样式映射
const qualityStyleMap: Record<string, string> = {
  unique: 'collapseQualityUnique',
  mythic: 'collapseQualityMythic',
  legendary: 'collapseQualityLegendary',
  epic: 'collapseQualityEpic',
  rare: 'collapseQualityRare',
  uncommon: 'collapseQualityUncommon',
};

/**
 * 可折叠面板组件
 */
export const Collapse: FC<CollapseProps> = ({
  title,
  children,
  defaultOpen = false,
  className = '',
  quality,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const qualityClass = quality && qualityStyleMap[quality] ? styles[qualityStyleMap[quality]] : '';
  const openClass = isOpen ? styles.open : '';

  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className={`${styles.collapse} ${openClass} ${qualityClass} ${className}`}>
      <div className={styles.collapseHeader} onClick={handleToggle}>
        <div className={styles.collapseTitle}>{title}</div>
        <i className={`${styles.collapseIcon} fa-solid fa-chevron-down`} />
      </div>
      <div className={styles.collapseContent}>
        <div className={styles.collapseBody}>{children}</div>
      </div>
    </div>
  );
};
