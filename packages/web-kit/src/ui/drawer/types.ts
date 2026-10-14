export interface XDrawerProps {
  open: boolean;
  /** 无障碍标题；开启 showHeader 时同时显示在默认标题栏中。 */
  title: string;
  /** 显示标题栏，默认关闭；支持 #action 操作区和 #header 自定义标题栏内容。 */
  showHeader?: boolean;
  description?: string;
  side?: 'left' | 'right' | 'top' | 'bottom';
  /** 左右抽屉宽度，数字单位为 px；默认 280，窄屏自动限制最大宽度。 */
  width?: number | string;
  /** 上下抽屉高度，数字单位为 px；默认 280，自动限制最大高度。 */
  height?: number | string;
}
