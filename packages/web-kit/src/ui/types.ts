import type { Component } from 'vue';

export type XButtonVariant =
  | 'primary'
  | 'outline'
  | 'danger'
  | 'ghost'
  | 'ghost-active'
  | 'subtle'
  | 'toolbar'
  | 'plain';

export type XButtonSize =
  'md' | 'sm' | 'xs' | 'icon' | 'icon-sm' | 'icon-xs' | 'none';

export interface XButtonProps {
  as?: string | Component;
  type?: 'button' | 'submit' | 'reset';
  variant?: XButtonVariant;
  size?: XButtonSize;
}

export interface XActionMenuProps {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  compact?: boolean;
}

export interface XActionMenuItemProps {
  disabled?: boolean;
  danger?: boolean;
}

export interface XAsyncContentProps {
  loading: boolean;
  error?: string;
  empty?: boolean;
  errorTitle?: string;
  retryLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  size?: 'compact' | 'default' | 'large';
  headingTag?: 'h1' | 'h2' | 'p';
  stateClass?: string;
  errorIcon?: boolean;
}

export interface XConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  danger?: boolean;
}

export interface XPaginationProps {
  page: number;
  totalPages: number;
}

export interface XSelectOption {
  label: string;
  value: string;
}

export interface XSelectProps {
  options: XSelectOption[];
  id?: string;
  ariaLabel?: string;
  disabled?: boolean;
  required?: boolean;
  rounded?: boolean;
}
