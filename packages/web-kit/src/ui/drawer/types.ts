export interface XDrawerProps {
  open: boolean;
  /** 无障碍标题，不显示在抽屉内；可在内容插槽自行添加可见标题。 */
  title: string;
  description?: string;
  side?: 'left' | 'right' | 'top' | 'bottom';
  /** 左右抽屉宽度，数字单位为 px；默认 280，窄屏自动限制最大宽度。 */
  width?: number | string;
  /** 上下抽屉高度，数字单位为 px；默认 280，自动限制最大高度。 */
  height?: number | string;
}
