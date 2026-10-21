import { tv } from 'tailwind-variants';

/**
 * 输入类字段的共用外壳。XInput 与 XAutoComplete 的尺寸、校验与焦点样式必须
 * 来自同一处，否则两份 token 会各自漂移。
 */
export const fieldVariants = tv({
  base: 'flex w-full min-w-0 items-center gap-2 rounded-sm border bg-transparent text-ink transition-colors',
  variants: {
    size: {
      sm: 'min-h-9 px-2.5 text-sm',
      md: 'min-h-10 px-3 text-sm',
      lg: 'min-h-11 px-3.5 text-base',
    },
    invalid: {
      true: 'border-error focus-within:ring-2 focus-within:ring-error/15',
      false: 'border-border',
    },
    disabled: {
      true: 'cursor-not-allowed opacity-50',
      false: '',
    },
  },
  compoundVariants: [
    {
      invalid: false,
      disabled: false,
      class:
        'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15',
    },
  ],
  defaultVariants: { size: 'md', invalid: false, disabled: false },
});

/** 前后缀、图标等装饰性插槽的容器。 */
export const fieldSlotClass = 'inline-flex shrink-0 items-center text-muted';

/** 字段内的透明输入控件，边框与焦点环由外层外壳负责。 */
export const fieldInputClass =
  'w-full min-w-0 flex-1 border-0 bg-transparent py-1.5 text-inherit outline-none placeholder:text-muted disabled:cursor-not-allowed';

/** 清空按钮；mousedown.prevent 等交互细节由调用方保留。 */
export const fieldClearClass =
  'inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
