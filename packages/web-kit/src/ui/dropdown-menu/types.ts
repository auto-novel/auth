export interface XDropdownMenuProps {
  /** 可选受控状态；省略时由组件维护开关。 */
  open?: boolean;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  /** 禁用触发器，不强制关闭已打开的菜单。 */
  disabled?: boolean;
  modal?: boolean;
  /** 应用于传送到 Portal 的菜单内容，而非触发器。 */
  contentClass?: string;
}

export interface XDropdownMenuItemProps {
  disabled?: boolean;
  destructive?: boolean;
}
