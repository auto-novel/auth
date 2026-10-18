/** Single-thumb horizontal slider. Use id/ariaLabel/ariaLabelledby to name the thumb. */
export interface XSliderProps {
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  name?: string;
  id?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
}
