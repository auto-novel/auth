import type { XUi } from '../classes';

export type XTooltipUi = XUi<'content'>;

export interface XTooltipProps {
  ui?: XTooltipUi;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  delayDuration?: number;
}
