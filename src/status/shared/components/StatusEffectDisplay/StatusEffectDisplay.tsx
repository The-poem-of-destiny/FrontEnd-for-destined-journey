import { FC } from 'react';
import { EditableField } from '../EditableField';
import { EmptyHint } from '../EmptyHint';
import { SelectEditorOption } from '../editors';
import styles from './StatusEffectDisplay.module.scss';

export type StatusEffectItem = {
  类型?: string;
  效果?: string;
  层数?: number;
  剩余时间?: string;
  来源?: string;
};

export interface StatusEffectDisplayProps {
  effects: Record<string, StatusEffectItem>;
  mode?: 'full' | 'chips';
  compact?: boolean;
  editEnabled?: boolean;
  pathPrefix?: string;
  emptyText?: string;
  /** chips 模式下最多展示的数量（超出显示 +N） */
  maxVisible?: number;
  /** chips 模式下是否显示剩余数量 */
  showRemainingCount?: boolean;
  onDelete?: (name: string) => void;
}

const StatusEffectTypeOptions: SelectEditorOption[] = [
  { label: '增益', value: '增益' },
  { label: '减益', value: '减益' },
  { label: '特殊', value: '特殊' },
];

const getToneClass = (type: string | undefined) => {
  if (type === '减益') {
    return styles.effectDebuff;
  }

  if (type === '特殊') {
    return styles.effectSpecial;
  }

  return styles.effectBuff;
};

const getChipToneClass = (type: string | undefined) => {
  if (type === '减益') {
    return styles.buffChipDebuff;
  }

  if (type === '特殊') {
    return styles.buffChipSpecial;
  }

  return styles.buffChipBuff;
};

const renderChips = (
  effects: Record<string, StatusEffectItem>,
  compact: boolean,
  emptyText: string,
  maxVisible: number | undefined,
  showRemainingCount: boolean,
) => {
  const entries = Object.entries(effects);

  if (!entries.length) {
    return <span className={styles.buffEmpty}>{emptyText}</span>;
  }

  const visibleEntries = typeof maxVisible === 'number' ? entries.slice(0, maxVisible) : entries;
  const remainingCount = Math.max(entries.length - visibleEntries.length, 0);

  return (
    <div className={`${styles.buffChipGroup} ${compact ? styles.buffChipGroupCompact : ''}`}>
      {visibleEntries.map(([name, effect]) => (
        <span
          key={name}
          className={`${styles.buffChip} ${getChipToneClass(effect.类型)}`}
          title={effect.效果 || name}
        >
          <span className={styles.buffChipName}>{name}</span>
          {typeof effect.层数 === 'number' && effect.层数 > 1 ? (
            <span className={styles.buffChipMeta}>x{effect.层数}</span>
          ) : null}
          {effect.剩余时间 ? <span className={styles.buffChipMeta}>{effect.剩余时间}</span> : null}
        </span>
      ))}
      {showRemainingCount && remainingCount > 0 ? (
        <span className={styles.buffChipMore}>+{remainingCount}</span>
      ) : null}
    </div>
  );
};

export const StatusEffectDisplay: FC<StatusEffectDisplayProps> = ({
  effects,
  mode = 'full',
  compact = false,
  editEnabled = false,
  pathPrefix,
  emptyText = '暂无状态效果',
  maxVisible,
  showRemainingCount = true,
  onDelete,
}) => {
  const entries = Object.entries(effects);

  if (mode === 'chips') {
    return renderChips(effects, compact, emptyText, maxVisible, showRemainingCount);
  }

  if (!entries.length) {
    return <EmptyHint className={styles.emptyEffects} text={emptyText} />;
  }

  return (
    <div className={styles.statusEffects}>
      {entries.map(([name, effect]) => {
        const toneClass = getToneClass(effect.类型);
        const basePath = pathPrefix ? `${pathPrefix}.${name}` : '';

        return (
          <div
            key={name}
            className={`${styles.effectItem} ${toneClass} ${editEnabled ? styles.effectItemEdit : ''}`}
          >
            {editEnabled && basePath ? (
              <>
                <div className={styles.effectEditHeader}>
                  <div className={styles.effectEditHeaderContent}>
                    <div className={styles.effectHeaderMain}>
                      <span className={styles.effectName}>{name}</span>
                      <EditableField
                        path={`${basePath}.类型`}
                        value={effect.类型 ?? '增益'}
                        type="select"
                        selectConfig={{ options: StatusEffectTypeOptions }}
                      />
                    </div>

                    <div className={styles.effectEditMetaGrid}>
                      <div className={styles.effectMetaItem}>
                        <span className={styles.effectMetaLabel}>层数</span>
                        <EditableField
                          path={`${basePath}.层数`}
                          value={effect.层数 ?? 1}
                          type="number"
                          numberConfig={{ min: 1, step: 1 }}
                        />
                      </div>
                      <div className={styles.effectMetaItem}>
                        <span className={styles.effectMetaLabel}>剩余时间</span>
                        <EditableField
                          path={`${basePath}.剩余时间`}
                          value={effect.剩余时间 ?? ''}
                          type="text"
                        />
                      </div>
                    </div>
                  </div>

                  {onDelete ? (
                    <button
                      className={styles.effectDeleteBtn}
                      onClick={() => onDelete(name)}
                      title="删除状态效果"
                      type="button"
                    >
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  ) : null}
                </div>

                <div className={styles.effectEditSection}>
                  <span className={styles.effectEditLabel}>效果</span>
                  <EditableField
                    path={`${basePath}.效果`}
                    value={effect.效果 ?? ''}
                    type="textarea"
                  />
                </div>

                <div className={styles.effectEditSection}>
                  <span className={styles.effectEditLabel}>来源</span>
                  <EditableField path={`${basePath}.来源`} value={effect.来源 ?? ''} type="text" />
                </div>
              </>
            ) : (
              <>
                <div className={styles.effectReadHeader}>
                  <div className={styles.effectHeaderMain}>
                    <span className={styles.effectName}>{name}</span>
                    {effect.类型 ? <span className={styles.effectType}>{effect.类型}</span> : null}
                  </div>
                  <div className={styles.effectMetaInline}>
                    {typeof effect.层数 === 'number' && effect.层数 > 1 ? (
                      <span className={styles.effectStack}>x{effect.层数}</span>
                    ) : null}
                    {effect.剩余时间 ? (
                      <span className={styles.effectTime}>{effect.剩余时间}</span>
                    ) : null}
                  </div>
                </div>

                {effect.效果 ? <div className={styles.effectDesc}>{effect.效果}</div> : null}
                {effect.来源 ? (
                  <div className={styles.effectSource}>来源：{effect.来源}</div>
                ) : null}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
