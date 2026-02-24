import { FC, useEffect, useMemo, useState } from 'react';
import { DefaultTabId, TabsConfig } from './config/tabs.config';
import { useEditorSettingStore, useMvuDataStore, useThemeStore } from './core/stores';
import { ContentArea, TabBar, TitleBar, Window } from './layout';
import { DestinyTab, ItemsTab, MapTab, NewsTab, QuestsTab, SettingsTab, StatusTab } from './pages';

const App: FC = () => {
  const [activeTab, setActiveTab] = useState(DefaultTabId);
  const [showSettings, setShowSettings] = useState(false);

  const { loadSettings } = useEditorSettingStore();
  const { loadTheme } = useThemeStore();
  const { data } = useMvuDataStore();

  useEffect(() => {
    loadSettings();
    loadTheme();
  }, [loadSettings, loadTheme]);

  /** 带 badge 的 Tab 配置 */
  const tabsWithBadge = useMemo(() => {
    const questCount = _.size(data?.任务列表);
    return TabsConfig.map(tab => (tab.id === 'quests' ? { ...tab, badge: questCount } : tab));
  }, [data?.任务列表]);

  /**
   * 渲染当前 Tab 内容
   */
  const renderTabContent = () => {
    // 如果显示设置页，渲染设置
    if (showSettings) {
      return <SettingsTab />;
    }

    // 根据激活的 Tab 渲染对应内容
    switch (activeTab) {
      case 'quests':
        return <QuestsTab />;
      case 'status':
        return <StatusTab />;
      case 'items':
        return <ItemsTab />;
      case 'destiny':
        return <DestinyTab />;
      case 'news':
        return <NewsTab />;
      case 'map':
        return <MapTab />;
      default:
        return <div className="placeholder">未知页面</div>;
    }
  };

  /**
   * 设置按钮点击
   */
  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  /**
   * Tab 切换
   */
  const handleTabChange = (tabId: string) => {
    setShowSettings(false);
    setActiveTab(tabId);
  };

  return (
    <Window>
      <TitleBar onSettingsClick={handleSettingsClick} />
      <TabBar
        tabs={tabsWithBadge}
        activeTab={showSettings ? '' : activeTab}
        onTabChange={handleTabChange}
      />
      <ContentArea>{renderTabContent()}</ContentArea>
    </Window>
  );
};

export default App;
