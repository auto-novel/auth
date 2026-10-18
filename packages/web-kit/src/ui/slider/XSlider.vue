<script setup lang="ts">
import {
  SliderRange,
  SliderRoot,
  SliderThumb,
  SliderTrack,
  useDirection,
} from 'reka-ui';
import { computed, ref, toRef, useAttrs } from 'vue';

import type { XSliderMarks, XSliderProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<Omit<XSliderProps, 'modelValue'>>(), {
  min: 0,
  max: 100,
  step: 1,
  orientation: 'horizontal',
  inverted: false,
  size: 'md',
  tone: 'primary',
  tooltip: false,
  snapToMarks: false,
  ui: () => ({}),
});

const model = defineModel<number | null>();
const emit = defineEmits<{ commit: [value: number] }>();

const attrs = useAttrs();
const hovered = ref(false);
const focused = ref(false);

const direction = useDirection(toRef(props, 'dir'));
const isVertical = computed(() => props.orientation === 'vertical');
const marksReversed = computed(() =>
  isVertical.value
    ? props.inverted
    : props.inverted !== (direction.value === 'rtl'),
);
const rootId = computed(() => attrs.id as string | undefined);
const currentValue = computed(() =>
  typeof model.value === 'number' ? model.value : props.min,
);

/** 单值模型在未设置时以 min 呈现，但不会回写，保留“未设置”语义。 */
const sliderValue = computed(() => [currentValue.value]);

interface MarkItem {
  value: number;
  label?: string;
}

const markItems = computed<MarkItem[]>(() => {
  const marks: XSliderMarks | undefined = props.marks;
  if (!marks) return [];
  const entries: MarkItem[] = Array.isArray(marks)
    ? marks.map((value) => ({ value }))
    : Object.entries(marks).map(([key, label]) => ({
        value: Number(key),
        label,
      }));
  const seen = new Set<number>();
  return entries
    .filter((mark) => {
      if (!Number.isFinite(mark.value)) return false;
      if (mark.value < props.min || mark.value > props.max) return false;
      if (seen.has(mark.value)) return false;
      seen.add(mark.value);
      return true;
    })
    .sort((a, b) => a.value - b.value);
});

const hasMarkLabels = computed(() =>
  markItems.value.some((mark) => Boolean(mark.label)),
);

function toPercent(value: number) {
  if (props.max === props.min) return 0;
  return ((value - props.min) / (props.max - props.min)) * 100;
}

/** 横向刻度同时考虑文本方向与反向，纵向只受反向影响，与 Reka 保持一致。 */
function markStyle(value: number) {
  const percent = marksReversed.value
    ? 100 - toPercent(value)
    : toPercent(value);
  return isVertical.value ? { bottom: `${percent}%` } : { left: `${percent}%` };
}

let keyboardInput = false;
/** 提交时 Reka 会先发 valueCommit 再发 update:modelValue，用它跳过重复回放。 */
let committedRaw: number | undefined;

function snapValue(raw: number) {
  const marks = markItems.value;
  if (!props.snapToMarks || marks.length === 0) return raw;
  const nearest = marks.reduce(
    (best, mark) =>
      Math.abs(mark.value - raw) < Math.abs(best - raw) ? mark.value : best,
    marks[0]!.value,
  );
  if (!keyboardInput || nearest !== currentValue.value) return nearest;
  // 键盘一次只走一个 step，可能小于半个刻度间距；此时改取行进方向上的相邻刻度。
  const adjacent =
    raw > currentValue.value
      ? marks.find((mark) => mark.value > currentValue.value)
      : [...marks].reverse().find((mark) => mark.value < currentValue.value);
  return adjacent?.value ?? nearest;
}

function updateValue(values: number[] | undefined) {
  const raw = values?.[0];
  if (raw === undefined) return;
  if (committedRaw === raw) {
    committedRaw = undefined;
    return;
  }
  const value = snapValue(raw);
  if (value !== model.value) model.value = value;
}

function commitValue(values: number[]) {
  const raw = values[0];
  if (raw === undefined) return;
  const value = snapValue(raw);
  committedRaw = raw;
  if (value !== model.value) model.value = value;
  emit('commit', value);
}

function markInput(isKeyboard: boolean) {
  keyboardInput = isKeyboard;
  committedRaw = undefined;
}

const displayValue = computed(() =>
  props.formatValue
    ? props.formatValue(currentValue.value)
    : String(currentValue.value),
);

const ariaValueText = computed(() =>
  props.formatValue ? displayValue.value : (attrs['aria-valuetext'] as string),
);

const showTooltip = computed(() => {
  if (props.tooltip === 'always') return true;
  return props.tooltip === true && (hovered.value || focused.value);
});

const sizeClass = computed(
  () =>
    ({
      sm: { horizontal: 'h-0.5', vertical: 'w-0.5', thumb: 'size-3' },
      md: { horizontal: 'h-1', vertical: 'w-1', thumb: 'size-4' },
      lg: { horizontal: 'h-1.5', vertical: 'w-1.5', thumb: 'size-5' },
    })[props.size],
);

const toneClass = computed(
  () =>
    ({
      primary: {
        range: 'bg-primary',
        thumb: 'border-primary focus-visible:ring-primary/20',
      },
      danger: {
        range: 'bg-error',
        thumb: 'border-error focus-visible:ring-error/20',
      },
      muted: {
        range: 'bg-muted',
        thumb: 'border-muted focus-visible:ring-muted/20',
      },
    })[props.tone],
);

const rootClass = computed(() => [
  'relative flex touch-none select-none items-center',
  'data-disabled:cursor-not-allowed data-disabled:opacity-50',
  isVertical.value ? 'h-32 w-5 justify-center' : 'w-full',
  !isVertical.value && (hasMarkLabels.value ? 'h-12' : 'h-6'),
]);

const trackClass = computed(() => [
  'relative overflow-hidden rounded-full bg-border',
  isVertical.value ? 'h-full shrink-0' : 'w-full grow',
  sizeClass.value[props.orientation],
  props.ui.track,
]);

const thumbClass = computed(() => [
  'block rounded-full border-2 bg-surface shadow-sm outline-none transition-shadow focus-visible:ring-4 data-disabled:pointer-events-none motion-reduce:transition-none',
  sizeClass.value.thumb,
  toneClass.value.thumb,
  props.ui.thumb,
]);

const tooltipClass = computed(() => [
  'pointer-events-none absolute z-10 rounded-sm bg-ink px-2 py-1 text-xs font-medium whitespace-nowrap text-surface shadow-sm select-none',
  isVertical.value
    ? 'top-1/2 right-full mr-2 -translate-y-1/2'
    : 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  props.ui.tooltip,
]);

const markTickClass = computed(() => [
  'absolute bg-border',
  isVertical.value
    ? 'left-1/2 ml-0.5 h-px w-1 -translate-y-1/2'
    : 'top-1/2 mt-0.5 h-1 w-px -translate-x-1/2',
  props.ui.mark,
]);

const markLabelClass = computed(() => [
  'absolute text-xs whitespace-nowrap text-muted',
  isVertical.value
    ? 'left-1/2 ml-2 -translate-y-1/2'
    : 'top-[30px] -translate-x-1/2',
  props.ui.mark,
]);

function thumbAttrs() {
  const { class: _class, style: _style, id: _id, ...rest } = attrs;
  return rest;
}
</script>

<template>
  <SliderRoot
    :id="rootId"
    :class="[attrs.class, rootClass]"
    :style="attrs.style"
    :model-value="sliderValue"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    :orientation="orientation"
    :inverted="inverted"
    :dir="direction"
    @update:model-value="updateValue"
    @value-commit="commitValue"
    @keydown.capture="markInput(true)"
    @pointerdown.capture="markInput(false)"
    @pointerenter="hovered = true"
    @pointerleave="hovered = false"
    @focusin="focused = true"
    @focusout="focused = false"
  >
    <input
      v-if="name"
      type="number"
      step="any"
      class="sr-only"
      tabindex="-1"
      aria-hidden="true"
      :name="name"
      :value="currentValue"
      :required="required"
      :disabled="disabled"
    />
    <SliderTrack :class="trackClass">
      <SliderRange
        :class="[
          'absolute rounded-full',
          isVertical ? 'w-full' : 'h-full',
          toneClass.range,
          ui.range,
        ]"
      />
    </SliderTrack>
    <span
      v-if="markItems.length"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0"
    >
      <template v-for="mark in markItems" :key="mark.value">
        <span :class="markTickClass" :style="markStyle(mark.value)" />
        <span
          v-if="mark.label"
          :class="markLabelClass"
          :style="markStyle(mark.value)"
        >
          {{ mark.label }}
        </span>
      </template>
    </span>
    <SliderThumb
      v-bind="thumbAttrs()"
      :class="thumbClass"
      :aria-valuetext="ariaValueText"
    >
      <span v-if="showTooltip" aria-hidden="true" :class="tooltipClass">
        {{ displayValue }}
      </span>
    </SliderThumb>
  </SliderRoot>
</template>
