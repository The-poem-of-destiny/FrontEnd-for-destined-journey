import type { FC, ReactNode } from 'react';

export interface EmptyHintProps {
  className?: string;
  icon?: string;
  text?: ReactNode;
  as?: 'div' | 'span';
  children?: ReactNode;
}

/**
 * 空状态提示
 * 使用传入的 className 来对齐各页面风格
 */
export const EmptyHint: FC<EmptyHintProps> = ({ className, icon, text, as = 'div', children }) => {
  const Component = as;

  return (
    <Component className={className}>
      {icon && <i className={icon} aria-hidden="true" />}
      {text}
      {children}
    </Component>
  );
};
