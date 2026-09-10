<script setup lang="ts">
import type { WebKitMenuOption } from '../types';

defineProps<{
  options: WebKitMenuOption[];
  selected?: string;
  collapsed?: boolean;
}>();

const emit = defineEmits<{
  select: [option: WebKitMenuOption];
}>();
</script>

<template>
  <nav class="grid gap-1" aria-label="站点导航">
    <button
      v-for="option in options"
      :key="option.key"
      type="button"
      class="web-kit-sidebar-item"
      :class="
        selected === option.key
          ? 'bg-primary-soft text-primary'
          : 'text-ink hover:bg-hover'
      "
      :aria-label="collapsed ? option.label : undefined"
      :title="collapsed ? option.label : undefined"
      :aria-current="selected === option.key ? 'page' : undefined"
      @click="emit('select', option)"
    >
      <span class="grid size-5 flex-none place-items-center" aria-hidden="true">
        <component :is="option.icon" class="size-5" />
      </span>
      <span
        class="web-kit-sidebar-label"
        :class="collapsed ? 'opacity-0' : 'opacity-100'"
        :aria-hidden="collapsed"
      >
        {{ option.label }}
      </span>
    </button>
  </nav>
</template>
