<script setup lang="ts">
import { normalizeClass } from 'vue';

import type { XButtonProps } from './types';
import { buttonVariants } from './variants';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<XButtonProps>(), {
  as: 'button',
  type: 'button',
  variant: 'primary',
  size: 'md',
});
</script>

<template>
  <component
    :is="as"
    v-bind="{ ...$attrs, class: undefined }"
    :type="as === 'button' ? type : undefined"
    :class="
      buttonVariants({
        variant: props.variant,
        size: props.size,
        class: normalizeClass($attrs.class),
      })
    "
  >
    <slot />
  </component>
</template>
