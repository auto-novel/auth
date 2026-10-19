<script setup lang="ts">
import { CheckOutlined, ExpandMoreOutlined } from '@vicons/material';
import {
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
  type AcceptableValue,
} from 'reka-ui';
import { ref } from 'vue';

import { useOverlayLayer } from '../overlayLayer';

import { mergeClasses } from '../classes';
import type { XSelectProps } from './types';

defineOptions({ inheritAttrs: false });
withDefaults(defineProps<Omit<XSelectProps, 'modelValue'>>(), {
  ui: () => ({}),
});

const model = defineModel<string>({ required: true });

function handleChange(value: AcceptableValue) {
  if (typeof value !== 'string') return;
  model.value = value;
}
const open = ref(false);
const { contentStyle } = useOverlayLayer(open);
</script>

<template>
  <SelectRoot
    v-model:open="open"
    :model-value="model"
    :disabled="disabled"
    :required="required"
    @update:model-value="handleChange"
  >
    <SelectTrigger
      v-bind="{ ...$attrs, class: undefined }"
      :class="
        mergeClasses(
          'rounded-sm x-select-trigger flex min-h-10 w-full min-w-0 items-center justify-between gap-2 border border-border bg-transparent px-3 text-left text-sm font-normal text-ink outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50',
          ui.trigger,
          $attrs.class,
        )
      "
    >
      <SelectValue :class="mergeClasses('min-w-0 truncate', ui.value)" />
      <ExpandMoreOutlined
        :class="
          mergeClasses('x-select-chevron size-4 shrink-0 text-muted', ui.icon)
        "
        aria-hidden="true"
      />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        :style="contentStyle"
        position="popper"
        :side-offset="6"
        :class="
          mergeClasses(
            'x-select-content floating-panel floating-panel-motion min-w-(--reka-select-trigger-width) overflow-hidden p-1 text-ink',
            ui.content,
          )
        "
      >
        <ScrollAreaRoot type="auto" class="overflow-hidden">
          <SelectViewport as-child>
            <ScrollAreaViewport
              :class="mergeClasses('x-select-viewport', ui.viewport)"
              :tabindex="-1"
            >
              <SelectItem
                v-for="option in options"
                :key="option.value"
                :value="option.value"
                :class="
                  mergeClasses(
                    'x-select-item menu-item relative cursor-default pl-8 select-none',
                    ui.item,
                  )
                "
              >
                <SelectItemIndicator
                  :class="
                    mergeClasses('absolute left-2 text-primary', ui.indicator)
                  "
                >
                  <CheckOutlined class="size-4" aria-hidden="true" />
                </SelectItemIndicator>
                <SelectItemText class="min-w-0 truncate">
                  {{ option.label }}
                </SelectItemText>
              </SelectItem>
            </ScrollAreaViewport>
          </SelectViewport>
          <ScrollAreaScrollbar
            orientation="vertical"
            :class="mergeClasses('x-select-scrollbar', ui.scrollbar)"
          >
            <ScrollAreaThumb
              :class="mergeClasses('x-select-scrollbar-thumb', ui.thumb)"
            />
          </ScrollAreaScrollbar>
        </ScrollAreaRoot>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
