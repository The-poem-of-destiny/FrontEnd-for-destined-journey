import { FC } from 'react';
import { TextEditor } from '../TextEditor/TextEditor';

export interface TextareaEditorProps {
  /** 当前值 */
  value: string;
  /** 值变更回调 */
  onChange: (value: string) => void;
  /** 占位符 */
  placeholder?: string;
  /** 行数 */
  rows?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 最大长度 */
  maxLength?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 多行文本编辑器
 */
export const TextareaEditor: FC<TextareaEditorProps> = ({
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
  maxLength,
  className,
}) => {
  return (
    <TextEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      multiline
      rows={rows}
      disabled={disabled}
      maxLength={maxLength}
      className={className}
    />
  );
};
