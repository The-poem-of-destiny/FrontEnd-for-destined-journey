import type { TabItem } from '../layout';

/**
 * Tab 配置
 * 顺序：任务 -> 状态 -> 持有物 -> 命定 -> 新闻
 */
export const TabsConfig: TabItem[] = [
  {
    id: 'quests',
    label: '任务',
    icon: 'fa-solid fa-scroll',
  },
  {
    id: 'status',
    label: '信息',
    icon: 'fa-solid fa-user',
  },
  {
    id: 'items',
    label: '持有物',
    icon: 'fa-solid fa-briefcase',
  },
  {
    id: 'destiny',
    label: '命定',
    icon: 'fa-solid fa-star',
  },
  {
    id: 'news',
    label: '新闻',
    icon: 'fa-solid fa-newspaper',
  },
  {
    id: 'map',
    label: '地图',
    icon: 'fa-solid fa-map',
  },
];

/** 默认激活的 Tab */
export const DefaultTabId = 'status';
