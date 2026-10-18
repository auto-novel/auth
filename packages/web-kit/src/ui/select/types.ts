export interface XSelectOption {
  label: string;
  value: string;
}

/** class/style、id 与 aria-* 等透传属性作用于选择触发控件。 */
export interface XSelectProps {
  modelValue: string;
  options: XSelectOption[];
  disabled?: boolean;
  required?: boolean;
}
