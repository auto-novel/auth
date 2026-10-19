export interface XScrollAreaProps {
  /** 滚动条方向；both 同时启用横向和纵向滚动。 */
  orientation?: 'vertical' | 'horizontal' | 'both';
  type?: 'auto' | 'always' | 'scroll' | 'hover';
  scrollHideDelay?: number;
  /** 在视口上设置尺寸或内容布局，外层仍需有确定的尺寸。 */
  viewportClass?: string;
}
