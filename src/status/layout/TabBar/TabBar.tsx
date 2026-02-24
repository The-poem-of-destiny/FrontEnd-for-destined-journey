import { FC } from 'react';
import styles from './TabBar.module.scss';

export interface TabItem {
  id: string;
  label: string;
  icon: string;
  disabled?: boolean;
  badge?: number;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

/**
 * Tab 栏组件
 * 可扩展的 Tab 导航
 */
export const TabBar: FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className={styles.tabBar}>
      <div className={styles.list}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.item} ${activeTab === tab.id ? styles.itemActive : ''}`}
            onClick={() => onTabChange(tab.id)}
            disabled={tab.disabled}
          >
            <i className={tab.icon} />
            <span>{tab.label}</span>
            {tab.badge != null && tab.badge > 0 && (
              <span className={styles.badge}>{tab.badge > 99 ? '99+' : tab.badge}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
