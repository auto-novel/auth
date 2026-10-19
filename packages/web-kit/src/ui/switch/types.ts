import type { XUi } from '../classes';

export type XSwitchUi = XUi<'root' | 'thumb'>;

export interface XSwitchProps {
  modelValue?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  ui?: XSwitchUi;
}
