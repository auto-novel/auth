import type { XUi } from '../classes';

export type XScrollAreaUi = XUi<
  'root' | 'viewport' | 'scrollbar' | 'thumb' | 'corner'
>;

export interface XScrollAreaProps {
  /** 滚动条方向；both 同时启用横向和纵向滚动。 */
  orientation?: 'vertical' | 'horizontal' | 'both';
  type?: 'auto' | 'always' | 'scroll' | 'hover';
  scrollHideDelay?: number;
  /** 分区样式覆盖；外层仍需有确定的尺寸。 */
  ui?: XScrollAreaUi;
}
