import { FC, ReactNode } from 'react';
import styles from './ContentArea.module.scss';

interface ContentAreaProps {
  children: ReactNode;
}

/**
 * 内容区域组件
 * Tab 内容的容器
 */
export const ContentArea: FC<ContentAreaProps> = ({ children }) => {
  return <div className={styles.contentArea}>{children}</div>;
};
