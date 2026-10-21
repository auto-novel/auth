import type { XUi } from '../classes';
import type { XInputProps } from '../input/types';

export interface XAutoCompleteOption {
  /** 选中后写入输入框的字符串；必须非空且唯一。 */
  value: string;
  /** 候选展示文本，默认使用 value。 */
  label?: string;
  disabled?: boolean;
}

export type XAutoCompleteUi = XUi<
  | 'root'
  | 'input'
  | 'prefix'
  | 'suffix'
  | 'clear'
  | 'content'
  | 'viewport'
  | 'item'
  | 'empty'
>;

/** class/style 用于输入框外层，其余原生属性与事件透传给 input。 */
export interface XAutoCompleteProps extends Pick<
  XInputProps,
  | 'modelValue'
  | 'size'
  | 'disabled'
  | 'readonly'
  | 'clearable'
  | 'clearLabel'
  | 'invalid'
> {
  options: readonly (string | XAutoCompleteOption)[];
  /** 默认按 label/value 忽略大小写包含匹配；false 用于远程候选。 */
  filter?: false | ((query: string, option: XAutoCompleteOption) => boolean);
  /** 无匹配候选时的提示；候选为空且未输入时不展示弹层。 */
  emptyText?: string;
  ui?: XAutoCompleteUi;
}
