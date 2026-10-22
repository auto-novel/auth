<script setup lang="ts">
import { computed } from 'vue';

import { mergeClasses } from '../classes';

import type { XButtonProps } from './types';
import { buttonVariants } from './variants';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<XButtonProps>(), {
  as: 'button',
  type: 'button',
  variant: 'primary',
  size: 'md',
});

const blocked = computed(() => props.disabled || props.loading);

// 链接和自定义组件不受原生 disabled 约束，在捕获阶段阻止激活。
function guardClick(event: MouseEvent) {
  if (!blocked.value) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}
</script>

<template>
  <component
    :is="as"
    v-bind="{ ...$attrs, class: undefined }"
    :type="as === 'button' ? type : undefined"
    :disabled="blocked || undefined"
    :aria-disabled="blocked ? true : $attrs['aria-disabled']"
    :aria-busy="loading ? true : $attrs['aria-busy']"
    @click.capture="guardClick"
    :class="
      mergeClasses(
        buttonVariants({
          variant: props.variant,
          size: props.size,
        }),
        $attrs.class,
      )
    "
  >
    <span
      v-if="loading"
      class="size-[1em] shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
      aria-hidden="true"
    />
    <slot />
  </component>
</template>
