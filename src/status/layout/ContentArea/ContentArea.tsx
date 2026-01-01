import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { FC, ReactNode, useRef } from 'react';
import styles from './ContentArea.module.scss';

// 注册 GSAP React 插件
gsap.registerPlugin(useGSAP);

interface ContentAreaProps {
  children: ReactNode;
}

/**
 * 内容区域组件
 * Tab 内容的容器，带有 GSAP 淡入动画
 */
export const ContentArea: FC<ContentAreaProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用 useGSAP hook 实现淡入动画，自动处理清理
  useGSAP(
    () => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.35,
          ease: 'power2.out',
        },
      );
    },
    { dependencies: [children], scope: containerRef },
  );

  return (
    <div ref={containerRef} className={styles.contentArea}>
      {children}
    </div>
  );
};
