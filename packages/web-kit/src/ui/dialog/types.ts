export interface XDialogProps {
  open: boolean;
  /** 可见标题，也可通过 #title 提供；省略时须提供 aria-label 或 aria-labelledby。 */
  title?: string;
  /** 可见说明，也可通过 #description 提供。 */
  description?: string;
  /** 正文样式，可覆盖默认内边距；全屏模式不使用正文容器。 */
  bodyClass?: string;
  /** 默认正文独立滚动；false 时由调用方组织滚动区域，全屏模式忽略此项。 */
  scrollable?: boolean;
  /** 无装饰全屏布局：标题和说明仅供无障碍使用，插槽内容直接填充面板。 */
  fullScreen?: boolean;
  /** 默认可关闭；false 禁用关闭按钮、Escape 和遮罩关闭。 */
  closable?: boolean;
  closeLabel?: string;
}
