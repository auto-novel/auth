<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>

<template>
  <div
    class="grid w-full grid-cols-[64px_minmax(0,1fr)] items-baseline gap-4 [@media(max-width:480px)]:grid-cols-[52px_minmax(0,1fr)] [@media(max-width:480px)]:gap-2.5"
  >
    <span class="text-xs whitespace-nowrap text-muted">
      {{ label }}
    </span>
    <div class="min-w-0">
      <slot />
    </div>
  </div>
</template>
