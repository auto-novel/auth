<script setup lang="ts">
import { CloseOutlined } from '@vicons/material';
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxViewport,
} from 'reka-ui';
import {
  computed,
  ref,
  useTemplateRef,
  watch,
  type InputHTMLAttributes,
} from 'vue';

import { mergeClasses } from '../classes';
import {
  fieldClearClass,
  fieldInputClass,
  fieldSlotClass,
  fieldVariants,
} from '../field';
import { useOverlayLayer } from '../overlayLayer';
import type { XAutoCompleteOption, XAutoCompleteProps } from './types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<Omit<XAutoCompleteProps, 'modelValue'>>(),
  {
    // 避免 Vue 将未传入的 Boolean 联合类型自动转换为 false。
    filter: undefined,
    size: 'md',
    clearLabel: '清空输入',
    emptyText: '暂无匹配项',
    ui: () => ({}),
  },
);
const model = defineModel<string>({ default: '' });
const emit = defineEmits<{
  select: [option: XAutoCompleteOption];
  search: [query: string];
  clear: [];
}>();
// 弹层开关由本组件接管；根的 model 只用于打开时高亮当前值，写入统一走
// selectOption，因此不监听 ComboboxRoot 的 update:model-value。
const open = ref(false);
const editable = computed(() => !props.disabled && !props.readonly);
const { contentStyle } = useOverlayLayer(open);
const control = useTemplateRef<InstanceType<typeof ComboboxInput>>('control');
const input = computed(
  () => control.value?.$el as HTMLInputElement | undefined,
);
// 规范化只依赖 options，避免每次按键都重新建对象；空值由过滤剔除：
// Reka 不接受空字符串候选，空值仍可通过自由输入/清空得到。
const normalizedOptions = computed(() =>
  props.options
    .map((option) => (typeof option === 'string' ? { value: option } : option))
    .filter((option) => option.value),
);
const options = computed(() => {
  const query = model.value.toLocaleLowerCase();
  return normalizedOptions.value.filter((option) => {
    if (props.filter === false) return true;
    if (props.filter) return props.filter(model.value, option);
    return [option.label, option.value].some((text) =>
      text?.toLocaleLowerCase().includes(query),
    );
  });
});

watch(editable, (value) => {
  if (!value) open.value = false;
});
function setOpen(value: boolean) {
  open.value = editable.value && value;
}
function updateInput(value: string) {
  if (!editable.value) return;
  model.value = value;
  emit('search', value);
}
function selectOption(event: Event, option: XAutoCompleteOption) {
  // 接管 Reka 默认选中流程，统一提交字符串、关闭弹层并发出 select。
  event.preventDefault();
  if (!editable.value || option.disabled) return;
  model.value = option.value;
  // 鼠标点选会把焦点留在候选上，提交后交回输入框。
  focus();
  open.value = false;
  emit('select', option);
}
function focus(options?: FocusOptions) {
  input.value?.focus(options);
}
function clear() {
  if (!editable.value) return;
  updateInput('');
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
  <ComboboxRoot
    :model-value="model"
    :open="open"
    :disabled="disabled"
    :reset-search-term-on-blur="false"
    :reset-search-term-on-select="false"
    ignore-filter
    :open-on-focus="false"
    open-on-click
    @update:open="setOpen"
  >
    <ComboboxAnchor as-child>
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
          v-if="$slots.prefix"
          :class="mergeClasses(fieldSlotClass, ui.prefix)"
        >
          <slot name="prefix" />
        </span>
        <ComboboxInput
          ref="control"
          v-bind="{ ...$attrs, class: undefined, style: undefined }"
          :model-value="model"
          :disabled="disabled"
          :readonly="readonly"
          :aria-invalid="
            invalid
              ? true
              : ($attrs['aria-invalid'] as InputHTMLAttributes['aria-invalid'])
          "
          :class="mergeClasses(fieldInputClass, ui.input)"
          @update:model-value="updateInput"
        />
        <button
          v-if="clearable && model.length > 0 && editable"
          type="button"
          :aria-label="clearLabel"
          :class="mergeClasses(fieldClearClass, ui.clear)"
          @mousedown.prevent
          @click="clear"
        >
          <CloseOutlined class="size-4" aria-hidden="true" />
        </button>
        <span
          v-if="$slots.suffix"
          :class="mergeClasses(fieldSlotClass, ui.suffix)"
        >
          <slot name="suffix" />
        </span>
      </div>
    </ComboboxAnchor>
    <ComboboxPortal>
      <ComboboxContent
        position="popper"
        :side-offset="6"
        :style="contentStyle"
        :hide-when-empty="
          options.length === 0 && model.length === 0 && !$slots.empty
        "
        :class="
          mergeClasses(
            'x-auto-complete-content floating-panel floating-panel-motion w-(--reka-combobox-trigger-width) overflow-hidden p-1 text-ink',
            ui.content,
          )
        "
      >
        <ComboboxViewport
          :class="mergeClasses('x-auto-complete-viewport', ui.viewport)"
        >
          <ComboboxItem
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            :text-value="option.label ?? option.value"
            :disabled="option.disabled"
            :class="
              mergeClasses(
                'menu-item cursor-default select-none data-disabled:pointer-events-none data-disabled:opacity-50',
                ui.item,
              )
            "
            @select="selectOption($event, option)"
          >
            <slot name="option" :option="option">
              <span class="min-w-0 truncate">
                {{ option.label ?? option.value }}
              </span>
            </slot>
          </ComboboxItem>
          <div
            v-if="options.length === 0"
            role="status"
            :class="mergeClasses('px-3 py-2 text-sm text-muted', ui.empty)"
          >
            <slot name="empty">{{ emptyText }}</slot>
          </div>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
