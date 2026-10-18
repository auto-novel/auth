<script setup lang="ts">
import type { Component } from 'vue';

withDefaults(
  defineProps<{
    icon?: Component;
    size?: 'sm' | 'md';
  }>(),
  { size: 'sm' },
);
</script>

<template>
  <span
    class="grid flex-none place-items-center"
    :class="size === 'sm' ? 'size-4' : 'size-5'"
    aria-hidden="true"
  >
    <component
      :is="icon"
      v-if="icon"
      :class="size === 'sm' ? 'size-4' : 'size-5'"
    />
    <slot v-else />
  </span>
</template>
