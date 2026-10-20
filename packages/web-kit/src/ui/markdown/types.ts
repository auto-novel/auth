import type { XUi } from '../classes';
import type { MarkdownParser } from './render';

/**
 * 排版通过 --markdown-font-size / --markdown-line-height、
 * --markdown-heading-margin / --markdown-block-margin / --markdown-scroll-margin 覆盖。
 * 扩展配色通过 --markdown-star-color / --markdown-star-active-color、
 * --markdown-spoiler-background / --markdown-spoiler-color 覆盖。
 */
export interface XMarkdownContentProps {
  source: string;
  /** 由子网站创建并配置的解析器；不传时使用共享默认实例。 */
  markdown?: MarkdownParser;
}

export type XMarkdownEditorTool =
  | 'bold'
  | 'italic'
  | 'strike'
  | 'code'
  | 'link'
  | 'spoiler'
  | 'star'
  | 'details';
export type XMarkdownEditorUi = XUi<
  | 'root'
  | 'toolbar'
  | 'tabs'
  | 'tab'
  | 'tools'
  | 'tool'
  | 'textarea'
  | 'preview'
>;

export interface XMarkdownEditorToolButtonProps {
  /** 同时用于 tooltip 和 aria-label，图标按钮也必须提供名称。 */
  label: string;
  disabled?: boolean;
}

/** 非模型属性；字符串内容通过 v-model 绑定。 */
export interface XMarkdownEditorProps {
  /** 默认开启内置预览；关闭后只显示编辑标签。 */
  preview?: boolean;
  /** 预览解析器；不传时使用共享默认实例。 */
  markdown?: MarkdownParser;
  disabled?: boolean;
  readonly?: boolean;
  invalid?: boolean;
  placeholder?: string;
  rows?: number;
  maxlength?: number;
  /** 内容或宽度变化时自动调整高度，rows 作为最小高度。 */
  autosize?: boolean;
  /** 吸顶相对于最近的滚动容器，不隐含应用页头高度；吸顶后工具栏显示轻阴影。 */
  sticky?: boolean;
  stickyOffset?: number;
  /** 默认 bold、italic、strike、code、link；spoiler、star、details 按需开启，空数组隐藏全部按钮。 */
  tools?: XMarkdownEditorTool[];
  ui?: XMarkdownEditorUi;
}

export interface XMarkdownEditorActions {
  /** 包裹选区，未选中文字时使用 placeholder；返回是否成功。 */
  wrapSelection(
    prefix: string,
    suffix: string,
    placeholder?: string,
  ): Promise<boolean>;
  /** 插入独立文本块，必要时在两侧补换行。 */
  insertBlock(
    prefix: string,
    suffix?: string,
    placeholder?: string,
  ): Promise<boolean>;
}
