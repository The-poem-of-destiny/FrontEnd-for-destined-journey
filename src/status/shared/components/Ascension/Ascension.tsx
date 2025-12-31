import type { Ascension as AscensionType } from '@/status/core/types/mvu-data';
import { FC } from 'react';
import { EditableField } from '../EditableField';
import styles from './Ascension.module.scss';

export interface AscensionProps {
  data?: AscensionType;
  /** 是否紧凑模式（用于命定之人详情） */
  compact?: boolean;
  /** 是否启用编辑模式 */
  editEnabled?: boolean;
  /** 数据路径前缀 */
  pathPrefix?: string;
}

/** 渲染单个阶段项（要素/权能/法则） */
interface SectionConfig {
  data?: Record<string, Record<string, string>>;
  title: string;
  icon: string;
  itemClass: string;
}

/**
 * 登神长阶组件
 * 可复用于主角和命定之人
 */
export const Ascension: FC<AscensionProps> = ({
  data,
  compact = false,
  editEnabled = false,
  pathPrefix,
}) => {
  if (!data?.是否开启) {
    return <div className={styles.empty}>登神长阶尚未开启</div>;
  }

  /** 渲染阶段区块（要素/权能/法则） */
  const renderSection = ({
    data: sectionData,
    title,
    icon,
    itemClass,
    sectionKey,
  }: SectionConfig & { sectionKey: string }) => {
    // 如果数据为空则不显示（包括被 schema 过滤的情况）
    if (_.isEmpty(sectionData)) return null;

    return (
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <i className={icon} /> {title}
        </div>
        <div className={styles.items}>
          {_.map(sectionData, (details, name) => (
            <div key={name} className={`${styles.item} ${styles[itemClass]}`}>
              <div className={styles.itemName}>{name}</div>
              {editEnabled && pathPrefix ? (
                <div className={styles.itemDetails}>
                  <EditableField
                    path={`${pathPrefix}.${sectionKey}.${name}`}
                    value={details ?? {}}
                    type="keyvalue"
                    label={`${title} - ${name}`}
                  />
                </div>
              ) : (
                !_.isEmpty(details) && (
                  <div className={styles.itemDetails}>
                    {_.map(details, (value, key) => (
                      <div key={key} className={styles.detailRow}>
                        <span className={styles.detailKey}>{key}</span>
                        <span className={styles.detailValue}>{value}</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.ascension} ${compact ? styles.compact : ''}`}>
      {/* 要素 */}
      {renderSection({
        data: data.要素,
        title: '要素',
        icon: 'fa-solid fa-atom',
        itemClass: 'itemElement',
        sectionKey: '要素',
      })}

      {/* 权能 */}
      {renderSection({
        data: data.权能,
        title: '权能',
        icon: 'fa-solid fa-fire',
        itemClass: 'itemPower',
        sectionKey: '权能',
      })}

      {/* 法则 */}
      {renderSection({
        data: data.法则,
        title: '法则',
        icon: 'fa-solid fa-scroll',
        itemClass: 'itemLaw',
        sectionKey: '法则',
      })}

      {/* 神位 */}
      {data.神位 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <i className="fa-solid fa-crown" /> 神位
          </div>
          <div className={styles.godInfo}>
            {editEnabled && pathPrefix ? (
              <EditableField
                path={`${pathPrefix}.神位`}
                value={data.神位}
                type="text"
                label="神位"
              />
            ) : (
              <div className={styles.godTitle}>{data.神位}</div>
            )}
          </div>
        </div>
      )}

      {/* 神国 */}
      {(data.神国?.名称 || data.神国?.描述) && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <i className="fa-solid fa-landmark" /> 神国
          </div>
          <div className={styles.godInfo}>
            {editEnabled && pathPrefix ? (
              <>
                <div className={styles.godInfoRow}>
                  <span className={styles.godInfoLabel}>名称:</span>
                  <EditableField
                    path={`${pathPrefix}.神国.名称`}
                    value={data.神国?.名称}
                    type="text"
                    label="神国名称"
                  />
                </div>
                <div className={styles.godInfoRow}>
                  <span className={styles.godInfoLabel}>描述:</span>
                  <EditableField
                    path={`${pathPrefix}.神国.描述`}
                    value={data.神国?.描述}
                    type="textarea"
                    label="神国描述"
                  />
                </div>
              </>
            ) : (
              <>
                {data.神国?.名称 && <div className={styles.godTitle}>{data.神国.名称}</div>}
                {data.神国?.描述 && <div className={styles.kingdomDesc}>{data.神国.描述}</div>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
