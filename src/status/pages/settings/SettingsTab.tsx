import { FC } from 'react';
import { ThemeList } from '../../config/theme-presets';
import { useEditorSettingStore, useThemeStore } from '../../core/stores';
import type { ThemePresetId } from '../../core/types';
import { Card } from '../../shared/components';
import { ToggleEditor } from '../../shared/components/editors/ToggleEditor/ToggleEditor';
import styles from './SettingsTab.module.scss';

/**
 * 设置页组件
 */
export const SettingsTab: FC = () => {
  const {
    currentThemeId,
    qualityUniqueOverride,
    setTheme,
    setQualityUniqueOverride,
    resetQualityUniqueOverride,
    reset,
    saveTheme,
    getColors,
  } = useThemeStore();
  const { editEnabled, setEditEnabled, saveSettings } = useEditorSettingStore();
  const currentUniqueColor = getColors().qualityUnique;

  const handleToggle = async (next: boolean) => {
    setEditEnabled(next);
    await saveSettings();
    toastr.success(next ? '已启用编辑' : '已关闭编辑');
  };


  /** 处理保存 */
  const handleSave = async () => {
    await saveTheme();
    toastr.success('主题已保存');
  };

  /** 处理重置主题 */
  const handleReset = async () => {
    await reset();
    toastr.info('已恢复默认主题');
  };

  /** 恢复当前预设的唯一品质颜色 */
  const handleResetUniqueColor = async () => {
    await resetQualityUniqueOverride();
    toastr.info('已恢复当前主题的唯一品质颜色');
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
        <div className={styles.themeSelector}>
          <div className={styles.themeSelectorLabel}>选择主题</div>
          <div className={styles.themeOptions}>
            {ThemeList.map(theme => (
              <button
                key={theme.id}
                className={`${styles.themeOption} ${currentThemeId === theme.id ? styles.themeOptionActive : ''}`}
                onClick={() => setTheme(theme.id)}
              >
                <span className={styles.themePreview} data-theme={theme.id} />
                <span className={styles.themeName}>{theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.uniqueColorSetting}>
          <div>
            <div className={styles.themeSelectorLabel}>唯一品质颜色</div>
            <div className={styles.uniqueColorDescription}>
              仅修改“唯一”品质；其他品质颜色始终跟随主题预设。
            </div>
          </div>
          <div className={styles.uniqueColorControl}>
            <input
              className={styles.uniqueColorInput}
              type="color"
              value={currentUniqueColor}
              onChange={event => setQualityUniqueOverride(event.target.value)}
              aria-label="选择唯一品质颜色"
            />
            <code className={styles.uniqueColorValue}>{currentUniqueColor}</code>
            {qualityUniqueOverride ? (
              <button
                className={styles.resetColorButton}
                type="button"
                onClick={handleResetUniqueColor}
              >
                恢复预设色
              </button>
            ) : null}
          </div>
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
