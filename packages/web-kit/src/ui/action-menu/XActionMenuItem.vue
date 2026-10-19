<script setup lang="ts">
import { DropdownMenuItem } from 'reka-ui';

import { mergeClasses } from '../classes';
import type { XActionMenuItemProps } from './types';

defineProps<XActionMenuItemProps>();

defineEmits<{ activate: [] }>();
defineOptions({ inheritAttrs: false });
</script>

<template>
  <DropdownMenuItem
    v-bind="{ ...$attrs, class: undefined }"
    :disabled="disabled"
    :class="
      mergeClasses(
        'menu-item select-none data-disabled:pointer-events-none data-disabled:opacity-50',
        { 'text-error-strong': danger },
        $attrs.class,
      )
    "
    @select="$emit('activate')"
  >
    <slot />
  </DropdownMenuItem>
</template>
