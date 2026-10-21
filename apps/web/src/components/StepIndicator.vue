<script setup lang="ts">
/**
 * Read-only progress indicator for multi-step forms. Steps cannot be jumped to
 * directly, so it only reports where the user is.
 */
interface Props {
  /** Step labels in order; the flow always starts at step 1. */
  steps: string[];
  /** 1-based index of the step being shown. */
  current: number;
}

const props = defineProps<Props>();

type StepState = 'done' | 'current' | 'todo';

function state(index: number): StepState {
  if (index < props.current) return 'done';
  return index === props.current ? 'current' : 'todo';
}

const circleClass: Record<StepState, string> = {
  done: 'border-primary bg-primary text-on-primary',
  current: 'border-primary bg-primary text-on-primary',
  todo: 'border-outline text-outline',
};

const labelClass: Record<StepState, string> = {
  done: 'text-primary',
  current: 'text-primary font-bold',
  todo: 'text-outline',
};
</script>

<template>
  <ol class="mx-auto flex w-fit items-center gap-2 select-none">
    <li
      v-for="(label, index) in props.steps"
      :key="label"
      class="flex items-center gap-2"
      :aria-current="index + 1 === props.current ? 'step' : undefined"
    >
      <span
        class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs"
        :class="circleClass[state(index + 1)]"
      >
        {{ state(index + 1) === 'done' ? '✓' : index + 1 }}
      </span>

      <span
        class="text-sm whitespace-nowrap"
        :class="labelClass[state(index + 1)]"
      >
        {{ label }}
      </span>

      <span
        v-if="index < props.steps.length - 1"
        class="h-px w-8"
        :class="index + 1 < props.current ? 'bg-primary' : 'bg-outline-variant'"
      ></span>
    </li>
  </ol>
</template>
