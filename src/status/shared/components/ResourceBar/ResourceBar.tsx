import { FC } from 'react';
import styles from './ResourceBar.module.scss';

export interface ResourceBarProps {
  label: string;
  current: number;
  max: number;
  type: 'hp' | 'mp' | 'sp' | 'exp';
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
  showValues = true,
}) => {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const typeClass = styles[typeStyleMap[type]] || '';

  return (
    <div className={`${styles.resourceBar} ${typeClass}`}>
      <div className={styles.resourceBarLabel}>{label}</div>
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
