import { tv } from 'tailwind-variants';

export const buttonVariants = tv({
  base: 'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--button-color)] disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  variants: {
    // 颜色只提供令牌，外观统一消费变量；类名保持静态以供 Tailwind 扫描。
    color: {
      primary:
        '[--button-color:var(--color-primary)] [--button-on:var(--color-on-primary)] [--button-hover:var(--color-primary-hover)] [--button-pressed:var(--color-primary-pressed)] [--button-text:var(--color-primary-text)] [--button-soft:var(--color-primary-soft)] [--button-soft-hover:var(--color-primary-soft-hover)] [--button-soft-pressed:var(--color-primary-soft-pressed)]',
      neutral:
        '[--button-color:var(--color-neutral)] [--button-on:var(--color-on-neutral)] [--button-hover:var(--color-neutral-hover)] [--button-pressed:var(--color-neutral-pressed)] [--button-text:var(--color-neutral-text)] [--button-soft:var(--color-neutral-soft)] [--button-soft-hover:var(--color-neutral-soft-hover)] [--button-soft-pressed:var(--color-neutral-soft-pressed)]',
      danger:
        '[--button-color:var(--color-error)] [--button-on:var(--color-on-error)] [--button-hover:var(--color-error-hover)] [--button-pressed:var(--color-error-pressed)] [--button-text:var(--color-error-text)] [--button-soft:var(--color-error-soft)] [--button-soft-hover:var(--color-error-soft-hover)] [--button-soft-pressed:var(--color-error-soft-pressed)]',
      warning:
        '[--button-color:var(--color-warning)] [--button-on:var(--color-on-warning)] [--button-hover:var(--color-warning-hover)] [--button-pressed:var(--color-warning-pressed)] [--button-text:var(--color-warning-text)] [--button-soft:var(--color-warning-soft)] [--button-soft-hover:var(--color-warning-soft-hover)] [--button-soft-pressed:var(--color-warning-soft-pressed)]',
    },
    variant: {
      solid:
        'bg-[var(--button-color)] text-[color:var(--button-on)] hover:bg-[var(--button-hover)] active:bg-[var(--button-pressed)]',
      soft: 'bg-[var(--button-soft)] text-[color:var(--button-text)] hover:bg-[var(--button-soft-hover)] focus-visible:bg-[var(--button-soft-hover)] active:bg-[var(--button-soft-pressed)]',
      outline:
        'border border-[color:var(--button-color)]/50 text-[color:var(--button-text)] hover:bg-[var(--button-soft-hover)] active:bg-[var(--button-soft-pressed)]',
      ghost:
        'text-[color:var(--button-text)] hover:bg-[var(--button-soft-hover)] active:bg-[var(--button-soft-pressed)]',
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
  // 中性描边和透明操作沿用低强调文字及通用控件边框。
  compoundVariants: [
    {
      color: 'neutral',
      variant: ['outline', 'ghost'],
      class: 'text-muted hover:text-ink',
    },
    {
      color: 'neutral',
      variant: 'outline',
      class: 'border-border',
    },
  ],
  defaultVariants: { color: 'primary', variant: 'solid', size: 'md' },
});
