import { FC } from 'react';
import { Collapse, EditableField, EmptyHint, IconTitle } from '../../shared/components';
import { withMvuData, WithMvuDataProps } from '../../shared/hoc';
import styles from './NewsTab.module.scss';

/** 新闻类别配置 */
const NewsCategories = [
  {
    key: '阿斯塔利亚快讯',
    icon: 'fa-solid fa-newspaper',
    color: '#1976d2',
  },
  {
    key: '酒馆留言板',
    icon: 'fa-solid fa-clipboard',
    color: '#7b1fa2',
  },
  {
    key: '午后茶会',
    icon: 'fa-solid fa-mug-hot',
    color: '#c2185b',
  },
] as const;

/**
 * 新闻页内容组件
 */
const NewsTabContent: FC<WithMvuDataProps> = ({ data }) => {
  const news = data.新闻;

  /** 渲染新闻条目（可编辑） */
  const renderNewsItems = (categoryKey: string, categoryData: Record<string, string>) => {
    const entries = _.entries(categoryData);

    // 过滤出有内容的条目用于显示判断
    const hasContent = entries.some(([, value]) => !_.isEmpty(value));

    if (!hasContent) {
      return <EmptyHint className={styles.emptyHint} text="暂无消息" />;
    }

    return (
      <div className={styles.newsItems}>
        {entries.map(([title, content]) => {
          // 跳过空内容的条目
          if (_.isEmpty(content)) return null;

          const fieldPath = `新闻.${categoryKey}.${title}`;

          return (
            <div key={title} className={styles.newsItem}>
              <div className={styles.newsItemTitle}>{title}</div>
              <div className={styles.newsItemContent}>
                <EditableField
                  path={fieldPath}
                  value={content}
                  type="textarea"
                  label={`${categoryKey} - ${title}`}
                  className={styles.editableContent}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.newsTab}>
      {NewsCategories.map(category => {
        const categoryData = _.get(news, category.key, {}) as Record<string, string>;

        return (
          <Collapse
            key={category.key}
            defaultOpen={true}
            title={
              <IconTitle
                icon={category.icon}
                text={category.key}
                className={styles.newsCategoryTitle}
                style={{ color: category.color }}
              />
            }
          >
            {renderNewsItems(category.key, categoryData)}
          </Collapse>
        );
      })}
    </div>
  );
};

/**
 * 新闻页组件（使用 HOC 包装）
 */
export const NewsTab = withMvuData({ baseClassName: styles.newsTab })(NewsTabContent);
