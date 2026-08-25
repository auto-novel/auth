<script setup lang="ts">
import { NText } from 'naive-ui';

defineProps<{
  label: string;
}>();
</script>

<template>
  <div class="filter-row">
    <n-text class="filter-label" depth="3">{{ label }}</n-text>
    <div class="filter-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.filter-row {
  display: grid;
  width: 100%;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 16px;
  align-items: baseline;
}

.filter-label {
  font-size: 12px;
  white-space: nowrap;
}

.filter-content {
  min-width: 0;
}

@media (max-width: 480px) {
  .filter-row {
    grid-template-columns: 52px minmax(0, 1fr);
    gap: 10px;
  }
}
</style>
