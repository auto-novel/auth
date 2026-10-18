<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui';
import { useAttrs } from 'vue';
import type { XSliderProps } from './types';

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
function thumbAttrs() {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
}

withDefaults(defineProps<Omit<XSliderProps, 'modelValue'>>(), {
  min: 0,
  max: 100,
  step: 1,
});

const model = defineModel<number>({ default: 0 });
const emit = defineEmits<{ commit: [value: number] }>();

function updateValue(values: number[] | undefined) {
  const value = values?.[0];
  if (value !== undefined) model.value = value;
}

function commitValue(values: number[]) {
  // Reka may commit keyboard changes before emitting update:modelValue.
  const value = values[0];
  if (value === undefined) return;
  updateValue(values);
  emit('commit', value);
}
</script>

<template>
  <SliderRoot
    :class="$attrs.class"
    :style="$attrs.style"
    :model-value="[model]"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    :name="name"
    class="relative flex h-6 w-full touch-none items-center select-none data-disabled:cursor-not-allowed data-disabled:opacity-50"
    @update:model-value="updateValue"
    @value-commit="commitValue"
  >
    <SliderTrack
      class="relative h-1 w-full grow overflow-hidden rounded-full bg-border"
    >
      <SliderRange class="absolute h-full rounded-full bg-primary" />
    </SliderTrack>
    <SliderThumb
      v-bind="thumbAttrs()"
      class="block size-4 rounded-full border-2 border-primary bg-surface shadow-sm outline-none transition-shadow focus-visible:ring-4 focus-visible:ring-primary/20 data-disabled:pointer-events-none motion-reduce:transition-none"
    />
  </SliderRoot>
</template>
