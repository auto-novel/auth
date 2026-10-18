import type { Component } from 'vue';

export type XButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost';

export type XButtonSize = 'md' | 'sm' | 'xs' | 'icon' | 'icon-sm' | 'icon-xs';

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

export interface XTooltipProps {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  delayDuration?: number;
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
  /** 提供回调时显示重试按钮。 */
  onRetry?: () => void;
  retryLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  size?: 'compact' | 'default' | 'large';
}

/** confirm 仅通知操作；调用方在成功后关闭，loading 阻止交互关闭。 */
export interface XConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  danger?: boolean;
}

export interface XSelectOption {
  label: string;
  value: string;
}

/** class/style、id 与 aria-* 等透传属性作用于选择触发控件。 */
export interface XSelectProps {
  modelValue: string;
  options: XSelectOption[];
  disabled?: boolean;
  required?: boolean;
}
