export interface XActionMenuProps {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  compact?: boolean;
}

export interface XActionMenuItemProps {
  disabled?: boolean;
  danger?: boolean;
}
