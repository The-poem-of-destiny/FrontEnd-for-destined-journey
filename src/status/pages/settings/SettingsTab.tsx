import { FC } from 'react';
import { useEditorSettingStore, useThemeStore } from '../../core/stores';
import { Card } from '../../shared/components';
import { ToggleEditor } from '../../shared/components/editors/ToggleEditor/ToggleEditor';
import styles from './SettingsTab.module.scss';

/** 颜色配置分组 */
const ColorGroups = [
  {
    title: '窗口',
    colors: ['windowBg', 'windowBorder', 'titleBarBg'],
  },
  {
    title: 'Tab 栏',
    colors: ['tabBarBg', 'tabText', 'tabActiveText', 'tabIndicator'],
  },
  {
    title: '内容区',
    colors: ['contentBg', 'cardBg', 'cardBorder'],
  },
  {
    title: '文本',
    colors: ['textPrimary', 'textSecondary', 'textMuted'],
  },
  {
    title: '资源条',
    colors: ['resourceHp', 'resourceMp', 'resourceSp', 'resourceExp'],
  },
] as const;

/** 颜色名称映射 */
const ColorLabels: Record<string, string> = {
  windowBg: '窗口背景',
  windowBorder: '窗口边框',
  titleBarBg: '标题栏背景',
  tabBarBg: 'Tab栏背景',
  tabText: 'Tab文字',
  tabActiveText: 'Tab激活文字',
  tabIndicator: 'Tab指示器',
  contentBg: '内容区背景',
  cardBg: '卡片背景',
  cardBorder: '卡片边框',
  textPrimary: '主要文字',
  textSecondary: '次要文字',
  textMuted: '淡化文字',
  resourceHp: '生命值',
  resourceMp: '法力值',
  resourceSp: '体力值',
  resourceExp: '经验值',
};

/**
 * 设置页组件
 */
export const SettingsTab: FC = () => {
  const { getEffectiveColors, updateColor, reset, saveTheme } = useThemeStore();

  const { editEnabled, setEditEnabled, saveSettings } = useEditorSettingStore();

  const colors = getEffectiveColors();

  const handleToggle = async (next: boolean) => {
    setEditEnabled(next);
    await saveSettings();
    toastr.success(next ? '已启用编辑' : '已关闭编辑');
  };

  /** 处理颜色变化 */
  const handleColorChange = (key: string, value: string) => {
    updateColor(key as any, value);
  };

  /** 处理保存 */
  const handleSave = async () => {
    await saveTheme();
    toastr.success('主题已保存');
  };

  /** 处理重置 */
  const handleReset = async () => {
    await reset();
    toastr.info('已恢复默认主题');
  };

  return (
    <div className={styles.settingsTab}>
      {/* 编辑设置 */}
      <div className={styles.editSettingBar}>
        <span className={styles.editSettingLabel}>允许编辑数据</span>
        <ToggleEditor
          value={editEnabled}
          onChange={handleToggle}
          labelOff="关闭"
          labelOn="开启"
          size="sm"
        />
      </div>

      <Card title="主题设置" className={styles.settingsTabTheme}>
        <div className={styles.themeEditor}>
          {ColorGroups.map(group => (
            <div key={group.title} className={styles.colorGroup}>
              <div className={styles.colorGroupTitle}>{group.title}</div>
              <div className={styles.colorGroupItems}>
                {group.colors.map(colorKey => (
                  <div key={colorKey} className={styles.colorItem}>
                    <label className={styles.colorItemLabel}>
                      {ColorLabels[colorKey] || colorKey}
                    </label>
                    <input
                      type="color"
                      className={styles.colorItemInput}
                      value={(colors[colorKey as keyof typeof colors] as string) || '#000000'}
                      onChange={e => handleColorChange(colorKey, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.themeActions}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleReset}>
            恢复默认
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave}>
            保存主题
          </button>
        </div>
      </Card>
    </div>
  );
};
