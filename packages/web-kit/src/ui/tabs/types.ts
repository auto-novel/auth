export type XTabsValue = string | number;

export interface XTabsProps {
  modelValue?: XTabsValue;
  defaultValue?: XTabsValue;
  orientation?: 'horizontal' | 'vertical';
  activationMode?: 'automatic' | 'manual';
}

export interface XTabsListProps {
  loop?: boolean;
}

export interface XTabsTriggerProps {
  value: XTabsValue;
  disabled?: boolean;
}

export interface XTabsContentProps {
  value: XTabsValue;
  /** 保留未激活面板的挂载状态，组件仍会将其隐藏。 */
  forceMount?: boolean;
}
