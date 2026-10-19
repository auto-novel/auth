import type { XUi } from '../classes';

export type XDrawerUi = XUi<
  'content' | 'overlay' | 'header' | 'title' | 'description' | 'actions'
>;

export interface XDrawerProps {
  ui?: XDrawerUi;
  open: boolean;
  /** 无障碍标题；开启 showHeader 时同时显示在默认标题栏中。 */
  title: string;
  /** 显示默认标题栏，默认关闭；#action 添加操作区，#header 自动显示自定义标题栏。 */
  showHeader?: boolean;
  description?: string;
  side?: 'left' | 'right' | 'top' | 'bottom';
  /** 左右抽屉宽度或上下抽屉高度，数字单位为 px；默认 280。 */
  size?: number | string;
}
