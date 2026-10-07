import type { Component } from 'vue';

import type { XTimePreset, XTimeValue } from '../utils/time';

export type { XTimePreset, XTimeValue };

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

export interface XTimeProps {
  /** 时间值：Date、毫秒时间戳，或可被 Date 解析的字符串；空值/非法值不渲染。 */
  time?: XTimeValue;
  /** 格式预设，默认 `datetime`；传了非空 `format` 时忽略。 */
  preset?: XTimePreset;
  /** date-fns 格式串，优先于 `preset`。 */
  format?: string;
  /** `preset="relative"` 的基准时间，默认当前时刻。 */
  to?: XTimeValue;
}
