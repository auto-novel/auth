import type { XUi } from '../classes';

export type XActionMenuUi = XUi<'content' | 'trigger' | 'icon'>;

/** class/style 和其余透传属性作用于菜单内容；触发按钮通过 ui.trigger 定制。 */
export interface XActionMenuProps {
  ui?: XActionMenuUi;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  compact?: boolean;
}

export interface XActionMenuItemProps {
  disabled?: boolean;
  danger?: boolean;
}
