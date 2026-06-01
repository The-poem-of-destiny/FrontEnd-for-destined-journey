import type { CSSProperties, FC } from 'react';
import { getIconifyMask } from '../../../core/utils';
import styles from './ResourceBar.module.scss';

export interface ResourceBarProps {
  label: string;
  current: number;
  max: number;
  type: 'hp' | 'mp' | 'sp' | 'exp';
  icon?: string;
  showValues?: boolean;
}

// 类型映射到样式类名
const typeStyleMap: Record<string, string> = {
  hp: 'resourceBarHp',
  mp: 'resourceBarMp',
  sp: 'resourceBarSp',
  exp: 'resourceBarExp',
};

/**
 * 资源条组件（HP/MP/SP/EXP）
 */
export const ResourceBar: FC<ResourceBarProps> = ({
  label,
  current,
  max,
  type,
  icon,
  showValues = true,
}) => {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const typeClass = styles[typeStyleMap[type]] || '';
  const iconStyle = icon
    ? ({ '--resource-icon': getIconifyMask(icon) } as CSSProperties)
    : undefined;

  return (
    <div className={`${styles.resourceBar} ${typeClass}`} style={iconStyle}>
      <div className={styles.resourceBarLabelGroup}>
        {icon ? (
          <span className={styles.resourceBarIcon} aria-hidden="true" />
        ) : (
          <span className={styles.resourceBarAccent} />
        )}
        <div className={styles.resourceBarLabel}>{label}</div>
      </div>
      <div className={styles.resourceBarTrack}>
        <div className={styles.resourceBarFill} style={{ width: `${percentage}%` }} />
        {showValues && (
          <div className={styles.resourceBarValues}>
            {current} / {max}
          </div>
        )}
      </div>
    </div>
  );
};
