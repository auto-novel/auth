<script setup lang="ts">
import { DropdownMenuItem } from 'reka-ui';

import type { XActionMenuItemProps } from './types';

defineProps<XActionMenuItemProps>();

defineEmits<{ activate: [] }>();
</script>

<template>
  <DropdownMenuItem
    :disabled="disabled"
    class="account-menu-item select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    :class="{ 'text-error': danger }"
    @select="$emit('activate')"
  >
    <slot />
  </DropdownMenuItem>
</template>
