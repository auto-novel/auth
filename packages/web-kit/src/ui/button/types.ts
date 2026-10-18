import type { Component } from 'vue';

export type XButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost';

export type XButtonSize = 'md' | 'sm' | 'xs' | 'icon' | 'icon-sm' | 'icon-xs';

export interface XButtonProps {
  as?: string | Component;
  type?: 'button' | 'submit' | 'reset';
  variant?: XButtonVariant;
  size?: XButtonSize;
}
