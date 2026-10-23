<script setup lang="ts">
type StatusTone =
  'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

withDefaults(
  defineProps<{
    tone?: StatusTone;
    size?: 'sm' | 'md';
    round?: boolean;
  }>(),
  { tone: 'neutral', size: 'sm', round: false },
);

const toneClasses: Record<StatusTone, string> = {
  neutral: 'bg-hover text-muted',
  primary: 'bg-primary-soft text-primary-text',
  success: 'bg-success-soft text-success-text',
  warning: 'bg-warning-soft text-warning-text',
  error: 'bg-error-soft text-error-text',
  info: 'bg-info-soft text-info-text',
};

const sizeClasses = {
  sm: 'px-2 text-xs leading-[18px]',
  md: 'px-2.5 text-sm leading-6',
};
</script>

<template>
  <span
    :class="[
      'inline-flex flex-none items-center whitespace-nowrap',
      round ? 'rounded-full' : 'rounded-[3px]',
      sizeClasses[size],
      toneClasses[tone],
    ]"
  >
    <slot />
  </span>
</template>
