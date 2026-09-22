import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useEditorSettingStore, useMvuDataStore } from '../../core/stores';
import { EditableField } from '../../shared/components';
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
  const editEnabled = useEditorSettingStore(state => state.editEnabled);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenTarget, setFullscreenTarget] = useState<HTMLElement | null>(null);

  const worldInfo = data?.世界;

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    setFullscreenTarget(document.getElementById('status-window'));
  }, []);

  const isFullscreenSupported = useMemo(() => {
    if (typeof document === 'undefined' || !fullscreenTarget) {
      return false;
    }
    const element = fullscreenTarget as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
    };
    return Boolean(
      document.fullscreenEnabled ||
      element.requestFullscreen ||
      element.webkitRequestFullscreen ||
      element.msRequestFullscreen ||
      element.mozRequestFullScreen,
    );
  }, [fullscreenTarget]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!fullscreenTarget) {
        setIsFullscreen(false);
        return;
      }
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
        msFullscreenElement?: Element | null;
        mozFullScreenElement?: Element | null;
      };
      const activeElement =
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.msFullscreenElement ||
        doc.mozFullScreenElement;
      setIsFullscreen(activeElement === fullscreenTarget);
    };

    handleFullscreenChange();
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [fullscreenTarget]);

  const handleFullscreenToggle = useCallback(async () => {
    if (!fullscreenTarget) {
      return;
    }
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
      mozCancelFullScreen?: () => Promise<void>;
      webkitFullscreenElement?: Element | null;
      msFullscreenElement?: Element | null;
      mozFullScreenElement?: Element | null;
    };
    const activeElement =
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.msFullscreenElement ||
      doc.mozFullScreenElement;

    if (activeElement) {
      if (activeElement !== fullscreenTarget) {
        return;
      }
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
      }
      return;
    }

    const element = fullscreenTarget as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
    };

    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      await element.msRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      await element.mozRequestFullScreen();
    }
  }, [fullscreenTarget]);

  return (
    <div className={styles.titleBar}>
      {/* 世界信息 */}
      <div className={styles.info}>
        {(worldInfo?.时间 || editEnabled) && (
          <span className={styles.time}>
            <i className="fa-regular fa-clock" />
            {editEnabled ? (
              <EditableField
                path="世界.时间"
                value={worldInfo?.时间 ?? ''}
                type="text"
                className={styles.worldField}
              />
            ) : (
              worldInfo?.时间
            )}
          </span>
        )}
        {(worldInfo?.地点 || editEnabled) && (
          <span className={styles.location}>
            <i className="fa-solid fa-location-dot" />
            {editEnabled ? (
              <EditableField
                path="世界.地点"
                value={worldInfo?.地点 ?? ''}
                type="text"
                className={styles.worldField}
              />
            ) : (
              worldInfo?.地点
            )}
          </span>
        )}
      </div>

      {/* 操作按钮 */}
      <div className={styles.actions}>
        <button
          className={styles.btn}
          onClick={handleFullscreenToggle}
          disabled={!isFullscreenSupported}
          title={isFullscreen ? '退出全屏' : '进入全屏'}
        >
          <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} />
        </button>
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
