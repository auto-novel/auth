<script setup lang="ts">
import { computed } from 'vue';

import type { XButtonProps } from './types';

const props = withDefaults(defineProps<XButtonProps>(), {
  as: 'button',
  type: 'button',
  variant: 'primary',
  size: 'md',
});

const variantClass = computed(
  () =>
    ({
      primary: 'rounded-sm bg-primary text-on-primary hover:bg-primary-hover',
      outline:
        'rounded-sm border border-border text-muted hover:border-primary hover:text-primary',
      danger: 'rounded-sm bg-error text-on-error hover:bg-error-hover',
      ghost: 'rounded-sm text-muted hover:bg-paper hover:text-primary',
      'ghost-active': 'rounded-sm text-primary hover:bg-paper',
      subtle: 'rounded-sm text-muted hover:bg-divider/40 hover:text-ink',
      toolbar: 'rounded-sm text-ink hover:bg-divider/40',
      plain: '',
    })[props.variant],
);

const sizeClass = computed(
  () =>
    ({
      md: 'min-h-10 px-4 text-sm font-medium',
      sm: 'min-h-9 px-3 text-sm font-medium',
      xs: 'min-h-8 px-2 text-xs font-semibold',
      icon: 'size-9',
      'icon-sm': 'size-8',
      'icon-xs': 'size-6',
      none: '',
    })[props.size],
);
</script>

<template>
  <component
    :is="as"
    :type="as === 'button' ? type : undefined"
    :class="[
      'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50',
      variantClass,
      sizeClass,
    ]"
  >
    <slot />
  </component>
</template>
