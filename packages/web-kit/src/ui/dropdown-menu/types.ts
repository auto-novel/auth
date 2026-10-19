import type { XUi } from '../classes';

export type XDropdownMenuUi = XUi<'content'>;

export interface XDropdownMenuProps {
  ui?: XDropdownMenuUi;
  /** 可选受控状态；省略时由组件维护开关。 */
  open?: boolean;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  /** 禁用触发器，不强制关闭已打开的菜单。 */
  disabled?: boolean;
  modal?: boolean;
}

export interface XDropdownMenuItemProps {
  disabled?: boolean;
  destructive?: boolean;
}
