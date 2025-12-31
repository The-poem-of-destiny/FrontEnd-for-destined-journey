import { ComponentType, FC, ReactElement } from 'react';
import { useMvuDataStore } from '../../core/stores';
import type { StatData } from '../../core/types';

/**
 * HOC Props 接口
 * 被包装的组件将接收 data 作为 prop
 */
export interface WithMvuDataProps {
  data: StatData;
}

/**
 * HOC 配置选项
 */
export interface WithMvuDataOptions {
  /** 基础样式类名，用于生成 loading/error/empty 状态的样式类 */
  baseClassName?: string;
  /** 自定义 loading 渲染 */
  renderLoading?: (className?: string) => ReactElement;
  /** 自定义 error 渲染 */
  renderError?: (error: string, className?: string) => ReactElement;
  /** 自定义 empty 渲染 */
  renderEmpty?: (className?: string) => ReactElement;
}

/**
 * 高阶组件：为组件注入 MVU 数据并处理加载状态
 * @param options - HOC 配置选项
 * @returns 返回一个接收组件并返回增强组件的函数
 *
 * @example
 * ```tsx
 * // 基础用法
 * const MyTab = withMvuData({ baseClassName: 'myTab' })(MyTabContent);
 *
 * // MyTabContent 组件定义
 * const MyTabContent: FC<WithMvuDataProps> = ({ data }) => {
 *   // 直接使用 data，无需处理 loading/error 状态
 *   return <div>{data.某字段}</div>;
 * };
 *
 * // 自定义渲染
 * const MyTab = withMvuData({
 *   baseClassName: 'myTab',
 *   renderLoading: (cls) => <div className={cls}>加载中...</div>
 * })(MyTabContent);
 * ```
 */
export function withMvuData(options: WithMvuDataOptions = {}) {
  const { baseClassName = '', renderLoading, renderError, renderEmpty } = options;

  return function <P extends WithMvuDataProps>(
    WrappedComponent: ComponentType<P>,
  ): FC<Omit<P, keyof WithMvuDataProps>> {
    const WithMvuDataComponent: FC<Omit<P, keyof WithMvuDataProps>> = props => {
      const { data, loading, error } = useMvuDataStore();

      // 生成状态相关的样式类名
      const getStateClassName = (state: 'Loading' | 'Error' | 'Empty') => {
        return baseClassName ? `${baseClassName} ${baseClassName}${state}` : '';
      };

      // 处理 loading 状态
      if (loading) {
        if (renderLoading) {
          return renderLoading(getStateClassName('Loading'));
        }
        return <div className={getStateClassName('Loading')}>Loading...</div>;
      }

      // 处理 error 状态
      if (error) {
        if (renderError) {
          return renderError(error, getStateClassName('Error'));
        }
        return <div className={getStateClassName('Error')}>Error: {error}</div>;
      }

      // 处理 empty 状态
      if (!data) {
        if (renderEmpty) {
          return renderEmpty(getStateClassName('Empty'));
        }
        return <div className={getStateClassName('Empty')}>No data available.</div>;
      }

      // 数据就绪，渲染被包装的组件
      return <WrappedComponent {...(props as P)} data={data} />;
    };

    // 设置组件显示名称，方便调试
    WithMvuDataComponent.displayName = `withMvuData(${
      WrappedComponent.displayName || WrappedComponent.name || 'Component'
    })`;

    return WithMvuDataComponent;
  };
}
