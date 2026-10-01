<script setup lang="ts">
import { DropdownMenuItem } from 'reka-ui';

defineProps<{
  disabled?: boolean;
  danger?: boolean;
}>();

defineEmits<{ activate: [] }>();
</script>

<template>
  <DropdownMenuItem
    :disabled="disabled"
    class="cursor-default rounded-sm px-2.5 py-2 text-[0.8125rem] outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    :class="
      danger
        ? 'text-red-600 data-[highlighted]:bg-red-50'
        : 'text-ink data-[highlighted]:bg-paper'
    "
    @select="$emit('activate')"
  >
    <slot />
  </DropdownMenuItem>
</template>
