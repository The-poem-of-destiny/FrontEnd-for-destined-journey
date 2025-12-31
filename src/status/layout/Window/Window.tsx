import { FC, ReactNode, useEffect } from 'react';
import { useMvuDataStore, useThemeStore } from '../../core/stores';
import styles from './Window.module.scss';

interface WindowProps {
  children: ReactNode;
}

/**
 * 窗口容器组件
 */
export const Window: FC<WindowProps> = ({ children }) => {
  const { loadTheme, applyCssVariables } = useThemeStore();
  const { refresh } = useMvuDataStore();

  useEffect(() => {
    // 初始化
    loadTheme();
    applyCssVariables();
    refresh();
  }, []);

  return <div className={styles.statusWindow}>{children}</div>;
};
