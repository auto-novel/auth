import type { XUi } from '../classes';

export type XInputSize = 'sm' | 'md' | 'lg';
export type XInputType =
  'text' | 'password' | 'email' | 'search' | 'tel' | 'url';
export type XInputUi = XUi<'root' | 'input' | 'prefix' | 'suffix' | 'clear'>;

export interface XInputProps {
  /** 始终绑定字符串，不做数字或空值转换。 */
  modelValue?: string;
  type?: XInputType;
  size?: XInputSize;
  disabled?: boolean;
  readonly?: boolean;
  clearable?: boolean;
  clearLabel?: string;
  /** 标记校验错误，同时设置 aria-invalid。 */
  invalid?: boolean;
  ui?: XInputUi;
}
