import type { XUi } from '../classes';

export type XSliderOrientation = 'horizontal' | 'vertical';

export type XSliderSize = 'sm' | 'md' | 'lg';

export type XSliderTone = 'primary' | 'danger' | 'muted';

/** 刻度：对象键为刻度值、值为文案；数组形式仅提供吸附点，不显示文案。 */
export type XSliderMarks = Record<number, string> | number[];

/** 分区样式覆盖，与内置 class 合并。 */
export type XSliderUi = XUi<
  'root' | 'track' | 'range' | 'thumb' | 'tooltip' | 'markTick' | 'markLabel'
>;

/**
 * 单值滑块；class/style 与 id 作用于根节点，其余透传属性作用于滑块。
 *
 * name 会额外渲染一个仅屏幕阅读器可见的 number 输入框，保证表单内外都能随表单提交；
 * 该输入框不参与原生 min/max/step 校验。
 */
export interface XSliderProps {
  /** 当前值；传 null 或省略表示未设置，滑块停在 min，交互后才写回数值。 */
  modelValue?: number | null;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  orientation?: XSliderOrientation;
  /** 反向：横向从右到左，纵向从上到下。 */
  inverted?: boolean;
  /** 文本方向；通常由页面继承，仅在需要强制镜像时传入。 */
  dir?: 'ltr' | 'rtl';
  size?: XSliderSize;
  tone?: XSliderTone;
  /** 数值气泡：true 悬停或聚焦时显示，'always' 常显。 */
  tooltip?: boolean | 'always';
  /** 数值转文本，同时用于气泡文案与 aria-valuetext。 */
  formatValue?: (value: number) => string;
  marks?: XSliderMarks;
  /** 拖动与键盘调整时吸附到最近刻度。 */
  snapToMarks?: boolean;
  ui?: XSliderUi;
}
