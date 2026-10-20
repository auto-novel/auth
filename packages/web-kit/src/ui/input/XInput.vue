<script setup lang="ts">
import { CloseOutlined } from '@vicons/material';
import { useTemplateRef, type InputHTMLAttributes } from 'vue';

import { mergeClasses } from '../classes';
import type { XInputProps } from './types';

// class/style 用于外层布局，其他属性及原生事件均交给 input。
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<Omit<XInputProps, 'modelValue'>>(), {
  type: 'text',
  size: 'md',
  clearLabel: '清空输入',
  ui: () => ({}),
});
const model = defineModel<string>({ default: '' });
const emit = defineEmits<{ clear: [] }>();
const input = useTemplateRef<HTMLInputElement>('input');

function focus(options?: FocusOptions) {
  input.value?.focus(options);
}

function clear() {
  if (props.disabled || props.readonly) return;
  model.value = '';
  emit('clear');
  focus();
}

defineExpose({
  input,
  focus,
  blur: () => input.value?.blur(),
  select: () => input.value?.select(),
});
</script>

<template>
  <div
    :style="$attrs.style"
    :class="
      mergeClasses(
        'flex w-full min-w-0 items-center gap-2 rounded-sm border bg-transparent text-ink transition-colors',
        {
          'min-h-9 px-2.5 text-sm': size === 'sm',
          'min-h-10 px-3 text-sm': size === 'md',
          'min-h-11 px-3.5 text-base': size === 'lg',
          'border-border': !invalid,
          'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15':
            !disabled && !invalid,
          'border-error focus-within:ring-2 focus-within:ring-error/15':
            invalid,
          'cursor-not-allowed opacity-50': disabled,
        },
        ui.root,
        $attrs.class,
      )
    "
  >
    <span
      v-if="$slots.leading || leadingIcon"
      :class="
        mergeClasses('inline-flex shrink-0 items-center text-muted', ui.leading)
      "
    >
      <slot name="leading">
        <component :is="leadingIcon" class="size-5" aria-hidden="true" />
      </slot>
    </span>
    <span
      v-if="$slots.prefix"
      :class="
        mergeClasses('inline-flex shrink-0 items-center text-muted', ui.prefix)
      "
    >
      <slot name="prefix" />
    </span>
    <input
      ref="input"
      v-model="model"
      v-bind="{ ...$attrs, class: undefined, style: undefined }"
      :type="type"
      :disabled="disabled"
      :readonly="readonly"
      :aria-invalid="
        invalid
          ? true
          : ($attrs['aria-invalid'] as InputHTMLAttributes['aria-invalid'])
      "
      :class="
        mergeClasses(
          'w-full min-w-0 flex-1 border-0 bg-transparent py-1.5 text-inherit outline-none placeholder:text-muted disabled:cursor-not-allowed',
          ui.input,
        )
      "
    />
    <button
      v-if="clearable && model.length > 0 && !disabled && !readonly"
      type="button"
      :aria-label="clearLabel"
      :class="
        mergeClasses(
          'inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          ui.clear,
        )
      "
      @mousedown.prevent
      @click="clear"
    >
      <CloseOutlined class="size-4" aria-hidden="true" />
    </button>
    <span
      v-if="$slots.suffix"
      :class="
        mergeClasses('inline-flex shrink-0 items-center text-muted', ui.suffix)
      "
    >
      <slot name="suffix" />
    </span>
    <span
      v-if="$slots.tail || tailIcon"
      :class="
        mergeClasses('inline-flex shrink-0 items-center text-muted', ui.tail)
      "
    >
      <slot name="tail">
        <component :is="tailIcon" class="size-5" aria-hidden="true" />
      </slot>
    </span>
  </div>
</template>
