import { tv } from 'tailwind-variants';

export const buttonVariants = tv({
  base: 'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--button-color)] disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  variants: {
    // 颜色只提供令牌，外观统一消费变量；类名保持静态以供 Tailwind 扫描。
    color: {
      primary:
        '[--button-color:var(--color-primary)] [--button-on:var(--color-on-primary)] [--button-hover:var(--color-primary-hover)] [--button-pressed:var(--color-primary)]',
      neutral:
        '[--button-color:var(--color-ink)] [--button-on:var(--color-surface)] [--button-hover:color-mix(in_oklab,var(--color-ink)_90%,transparent)] [--button-pressed:color-mix(in_oklab,var(--color-ink)_80%,transparent)]',
      danger:
        '[--button-color:var(--color-error)] [--button-on:var(--color-on-error)] [--button-hover:var(--color-error-hover)] [--button-pressed:var(--color-error-strong)]',
      warning:
        '[--button-color:var(--color-warning)] [--button-on:var(--color-on-warning)] [--button-hover:var(--color-warning-hover)] [--button-pressed:var(--color-warning)]',
    },
    variant: {
      solid:
        'bg-[var(--button-color)] text-[color:var(--button-on)] hover:bg-[var(--button-hover)] active:bg-[var(--button-pressed)]',
      soft: 'bg-[var(--button-color)]/16 text-[color:var(--button-color)] hover:bg-[var(--button-color)]/22 focus-visible:bg-[var(--button-color)]/22 active:bg-[var(--button-color)]/28',
      outline:
        'border border-[color:var(--button-color)]/50 text-[color:var(--button-color)] hover:bg-[var(--button-color)]/10 active:bg-[var(--button-color)]/16',
      ghost:
        'text-[color:var(--button-color)] hover:bg-[var(--button-color)]/10 active:bg-[var(--button-color)]/16',
    },
    size: {
      md: 'min-h-10 px-4 text-sm font-medium',
      sm: 'min-h-9 px-3 text-sm font-medium',
      xs: 'min-h-8 px-2 text-xs font-semibold',
      tiny: 'h-[22px] rounded-[3px] px-1.5 text-xs font-normal',
      icon: 'size-9',
      'icon-sm': 'size-8',
      'icon-xs': 'size-6',
    },
  },
  // 中性色使用独立表面令牌，不沿用语义色的透明度配方。
  compoundVariants: [
    {
      color: 'neutral',
      variant: 'soft',
      class:
        'bg-button-neutral text-ink hover:bg-button-neutral-hover focus-visible:bg-button-neutral-hover active:bg-button-neutral-pressed',
    },
    {
      color: 'neutral',
      variant: ['outline', 'ghost'],
      class:
        'text-muted hover:bg-hover hover:text-ink active:bg-button-neutral-pressed',
    },
    {
      color: 'neutral',
      variant: 'outline',
      class: 'border-border',
    },
  ],
  defaultVariants: { color: 'primary', variant: 'solid', size: 'md' },
});
