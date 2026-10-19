<script setup lang="ts">
import { DropdownMenuItem } from 'reka-ui';

import { mergeClasses } from '../classes';
import type { XDropdownMenuItemProps } from './types';

defineProps<XDropdownMenuItemProps>();

const emit = defineEmits<{
  /** 原样传递 Reka 事件；preventDefault() 可阻止选中后关闭菜单。 */
  select: [event: Event];
}>();
defineOptions({ inheritAttrs: false });
</script>

<template>
  <DropdownMenuItem
    v-bind="{ ...$attrs, class: undefined }"
    :disabled="disabled"
    :class="
      mergeClasses(
        'menu-item select-none data-disabled:pointer-events-none data-disabled:opacity-50',
        { 'text-error-strong': destructive },
        $attrs.class,
      )
    "
    @select="emit('select', $event)"
  >
    <slot />
  </DropdownMenuItem>
</template>
