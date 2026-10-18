/** 单滑块水平控件；class/style 用于轨道容器，其余透传属性用于滑块。 */
export interface XSliderProps {
  modelValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  name?: string;
}
