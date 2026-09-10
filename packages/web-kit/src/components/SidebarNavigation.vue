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
      class="navigation-item"
      :class="
        selected === option.key
          ? 'bg-primary-soft text-primary'
          : 'text-ink hover:bg-paper'
      "
      :aria-label="collapsed ? option.label : undefined"
      :title="collapsed ? option.label : undefined"
      :aria-pressed="selected === option.key"
      @click="emit('select', option)"
    >
      <span
        class="grid size-7 flex-none place-items-center rounded-md text-primary transition-colors duration-300"
        :class="selected === option.key ? 'bg-surface' : ''"
        aria-hidden="true"
      >
        <component :is="option.icon" class="size-4" />
      </span>
      <span
        class="navigation-label truncate"
        :class="collapsed ? 'opacity-0' : 'opacity-100'"
        :aria-hidden="collapsed"
      >
        {{ option.label }}
      </span>
    </button>
  </nav>
</template>

<style scoped>
.navigation-item {
  display: flex;
  min-height: 2.75rem;
  min-width: 13rem;
  align-items: center;
  gap: 0.7rem;
  border-radius: 0.25rem;
  padding-inline: 0.625rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: left;
  transition:
    color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.navigation-label {
  transition: opacity 150ms ease;
}

.navigation-item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
