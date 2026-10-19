<script setup lang="ts">
import { DropdownMenuItem } from 'reka-ui';

import type { XDropdownMenuItemProps } from './types';

defineProps<XDropdownMenuItemProps>();

const emit = defineEmits<{
  /** 原样传递 Reka 事件；preventDefault() 可阻止选中后关闭菜单。 */
  select: [event: Event];
}>();
</script>

<template>
  <DropdownMenuItem
    :disabled="disabled"
    class="menu-item select-none data-disabled:pointer-events-none data-disabled:opacity-50"
    :class="{ 'text-error-strong': destructive }"
    @select="emit('select', $event)"
  >
    <slot />
  </DropdownMenuItem>
</template>
