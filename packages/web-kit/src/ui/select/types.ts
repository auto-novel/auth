import type { XUi } from '../classes';

export interface XSelectOption {
  label: string;
  value: string;
}

export type XSelectUi = XUi<
  | 'trigger'
  | 'value'
  | 'icon'
  | 'content'
  | 'viewport'
  | 'item'
  | 'indicator'
  | 'scrollbar'
  | 'thumb'
>;

/** class/style、id 与 aria-* 等透传属性作用于选择触发控件。 */
export interface XSelectProps {
  ui?: XSelectUi;
  modelValue: string;
  options: XSelectOption[];
  disabled?: boolean;
  required?: boolean;
}
