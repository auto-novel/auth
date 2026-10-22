import type { Component } from 'vue';

export type XButtonColor = 'primary' | 'neutral' | 'danger' | 'warning';

export type XButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost';

export type XButtonSize =
  'md' | 'sm' | 'xs' | 'tiny' | 'icon' | 'icon-sm' | 'icon-xs';

export interface XButtonProps {
  as?: string | Component;
  type?: 'button' | 'submit' | 'reset';
  /** 语义色，默认 primary；中性操作使用 neutral。 */
  color?: XButtonColor;
  /** 呈现方式，默认 solid；浅色背景使用 soft。 */
  variant?: XButtonVariant;
  size?: XButtonSize;
  disabled?: boolean;
  /** 显示加载指示器，并禁用点击和表单提交。 */
  loading?: boolean;
}
