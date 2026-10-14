export interface XDialogProps {
  open: boolean;
  title: string;
  description?: string;
  fullScreen?: boolean;
  /** 默认可关闭；false 禁用关闭按钮、Escape 和遮罩关闭。 */
  closable?: boolean;
  closeLabel?: string;
}
