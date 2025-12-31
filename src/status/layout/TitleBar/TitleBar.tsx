import { FC } from 'react';
import { useMvuDataStore } from '../../core/stores';
import styles from './TitleBar.module.scss';

interface TitleBarProps {
  onSettingsClick?: () => void;
}

/**
 * 标题栏组件
 * 显示世界信息和操作按钮
 */
export const TitleBar: FC<TitleBarProps> = ({ onSettingsClick }) => {
  const { data, refresh, loading } = useMvuDataStore();

  const worldInfo = data?.世界;

  return (
    <div className={styles.titleBar}>
      {/* 世界信息 */}
      <div className={styles.info}>
        {worldInfo?.时间 && (
          <span className={styles.time}>
            <i className="fa-regular fa-clock" />
            {worldInfo.时间}
          </span>
        )}
        {worldInfo?.地点 && (
          <span className={styles.location}>
            <i className="fa-solid fa-location-dot" />
            {worldInfo.地点}
          </span>
        )}
      </div>

      {/* 操作按钮 */}
      <div className={styles.actions}>
        <button
          className={styles.btn}
          onClick={() => refresh()}
          disabled={loading}
          title="刷新数据"
        >
          <i className={`fa-solid fa-rotate-right ${loading ? 'fa-spin' : ''}`} />
        </button>
        <button className={styles.btn} onClick={onSettingsClick} title="设置">
          <i className="fa-solid fa-gear" />
        </button>
      </div>
    </div>
  );
};
