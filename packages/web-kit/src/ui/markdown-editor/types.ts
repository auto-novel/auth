import type { XUi } from '../classes';

export type XMarkdownEditorTool =
  'bold' | 'italic' | 'strike' | 'code' | 'link';
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
  /** 传入空数组可隐藏内置格式按钮。 */
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
