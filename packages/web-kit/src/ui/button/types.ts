import type { Component } from 'vue';

export type XButtonVariant =
  'primary' | 'outline' | 'danger' | 'warning' | 'ghost';

export type XButtonSize = 'md' | 'sm' | 'xs' | 'icon' | 'icon-sm' | 'icon-xs';

export interface XButtonProps {
  as?: string | Component;
  type?: 'button' | 'submit' | 'reset';
  variant?: XButtonVariant;
  size?: XButtonSize;
  disabled?: boolean;
  /** 显示加载指示器，并禁用点击和表单提交。 */
  loading?: boolean;
}
