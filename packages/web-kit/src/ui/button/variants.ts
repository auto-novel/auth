import { tv } from 'tailwind-variants';

export const buttonVariants = tv({
  base: 'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50',
  variants: {
    variant: {
      primary: 'bg-primary text-on-primary hover:bg-primary-hover',
      outline:
        'border border-border text-muted hover:border-primary hover:text-primary',
      danger: 'bg-error text-on-error hover:bg-error-hover',
      ghost: 'text-muted hover:bg-paper hover:text-primary',
    },
    size: {
      md: 'min-h-10 px-4 text-sm font-medium',
      sm: 'min-h-9 px-3 text-sm font-medium',
      xs: 'min-h-8 px-2 text-xs font-semibold',
      icon: 'size-9',
      'icon-sm': 'size-8',
      'icon-xs': 'size-6',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});
