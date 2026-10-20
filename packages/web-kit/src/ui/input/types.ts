import type { Component } from 'vue';

import type { XUi } from '../classes';

export type XInputSize = 'sm' | 'md' | 'lg';
export type XInputType =
  'text' | 'password' | 'email' | 'search' | 'tel' | 'url';
export type XInputUi = XUi<
  'root' | 'input' | 'leading' | 'tail' | 'prefix' | 'suffix' | 'clear'
>;

export interface XInputProps {
  /** 始终绑定字符串，不做数字或空值转换。 */
  modelValue?: string;
  type?: XInputType;
  size?: XInputSize;
  disabled?: boolean;
  readonly?: boolean;
  clearable?: boolean;
  clearLabel?: string;
  /** 装饰性前置图标；leading 插槽可覆盖默认渲染。 */
  leadingIcon?: Component;
  /** 装饰性尾部图标；交互按钮使用 tail 插槽。 */
  tailIcon?: Component;
  /** 标记校验错误，同时设置 aria-invalid。 */
  invalid?: boolean;
  ui?: XInputUi;
}
