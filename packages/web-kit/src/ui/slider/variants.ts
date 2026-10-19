import { tv } from 'tailwind-variants';

export const sliderVariants = tv({
  slots: {
    root: 'relative flex touch-none select-none items-center data-disabled:cursor-not-allowed data-disabled:opacity-50',
    track: 'relative overflow-hidden rounded-full bg-border',
    range: 'absolute rounded-full',
    thumb:
      'block rounded-full border-2 bg-surface shadow-sm outline-none transition-shadow focus-visible:ring-4 data-disabled:pointer-events-none motion-reduce:transition-none',
    tooltip:
      'pointer-events-none absolute z-10 rounded-sm bg-ink px-2 py-1 text-xs font-medium whitespace-nowrap text-surface shadow-sm select-none',
    markTick: 'absolute bg-border',
    markLabel: 'absolute text-xs whitespace-nowrap text-muted',
  },
  variants: {
    size: {
      sm: { thumb: 'size-3' },
      md: { thumb: 'size-4' },
      lg: { thumb: 'size-5' },
    },
    tone: {
      primary: {
        range: 'bg-primary',
        thumb: 'border-primary focus-visible:ring-primary/20',
      },
      danger: {
        range: 'bg-error',
        thumb: 'border-error focus-visible:ring-error/20',
      },
      muted: {
        range: 'bg-muted',
        thumb: 'border-muted focus-visible:ring-muted/20',
      },
    },
    orientation: {
      horizontal: {
        root: 'w-full',
        track: 'w-full grow',
        range: 'h-full',
        tooltip: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
        markTick: 'top-1/2 mt-0.5 h-1 w-px -translate-x-1/2',
        markLabel: 'top-[30px] -translate-x-1/2',
      },
      vertical: {
        root: 'h-32 w-5 justify-center',
        track: 'h-full shrink-0',
        range: 'w-full',
        tooltip: 'top-1/2 right-full mr-2 -translate-y-1/2',
        markTick: 'left-1/2 ml-0.5 h-px w-1 -translate-y-1/2',
        markLabel: 'left-1/2 ml-2 -translate-y-1/2',
      },
    },
    hasMarkLabels: { true: {}, false: {} },
  },
  compoundVariants: [
    { orientation: 'horizontal', size: 'sm', class: { track: 'h-0.5' } },
    { orientation: 'horizontal', size: 'md', class: { track: 'h-1' } },
    { orientation: 'horizontal', size: 'lg', class: { track: 'h-1.5' } },
    { orientation: 'vertical', size: 'sm', class: { track: 'w-0.5' } },
    { orientation: 'vertical', size: 'md', class: { track: 'w-1' } },
    { orientation: 'vertical', size: 'lg', class: { track: 'w-1.5' } },
    {
      orientation: 'horizontal',
      hasMarkLabels: true,
      class: { root: 'h-12' },
    },
    {
      orientation: 'horizontal',
      hasMarkLabels: false,
      class: { root: 'h-6' },
    },
  ],
  defaultVariants: {
    size: 'md',
    tone: 'primary',
    orientation: 'horizontal',
    hasMarkLabels: false,
  },
});
