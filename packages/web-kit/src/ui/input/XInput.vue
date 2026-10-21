<script setup lang="ts">
import { CloseOutlined } from '@vicons/material';
import { useTemplateRef, type InputHTMLAttributes } from 'vue';

import { mergeClasses } from '../classes';
import {
  fieldClearClass,
  fieldInputClass,
  fieldSlotClass,
  fieldVariants,
} from '../field';
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
        fieldVariants({ size, invalid, disabled }),
        ui.root,
        $attrs.class,
      )
    "
  >
    <span
      v-if="$slots.leading || leadingIcon"
      :class="mergeClasses(fieldSlotClass, ui.leading)"
    >
      <slot name="leading">
        <component :is="leadingIcon" class="size-5" aria-hidden="true" />
      </slot>
    </span>
    <span v-if="$slots.prefix" :class="mergeClasses(fieldSlotClass, ui.prefix)">
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
      :class="mergeClasses(fieldInputClass, ui.input)"
    />
    <button
      v-if="clearable && model.length > 0 && !disabled && !readonly"
      type="button"
      :aria-label="clearLabel"
      :class="mergeClasses(fieldClearClass, ui.clear)"
      @mousedown.prevent
      @click="clear"
    >
      <CloseOutlined class="size-4" aria-hidden="true" />
    </button>
    <span v-if="$slots.suffix" :class="mergeClasses(fieldSlotClass, ui.suffix)">
      <slot name="suffix" />
    </span>
    <span
      v-if="$slots.tail || tailIcon"
      :class="mergeClasses(fieldSlotClass, ui.tail)"
    >
      <slot name="tail">
        <component :is="tailIcon" class="size-5" aria-hidden="true" />
      </slot>
    </span>
  </div>
</template>
