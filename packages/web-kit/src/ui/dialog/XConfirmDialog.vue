<script setup lang="ts">
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'reka-ui';

import XButton from '../button/XButton.vue';
import { useOverlayLayer } from '../overlayLayer';
import { mergeClasses } from '../classes';
import type { XConfirmDialogProps } from './types';

const props = withDefaults(defineProps<XConfirmDialogProps>(), {
  ui: () => ({}),
  confirmLabel: '确认',
});

const emit = defineEmits<{
  'update:open': [open: boolean];
  confirm: [];
}>();

const { overlayStyle, contentStyle } = useOverlayLayer(() => props.open);

function confirm() {
  if (!props.loading) emit('confirm');
}
defineOptions({ inheritAttrs: false });
</script>

<template>
  <AlertDialogRoot
    :open="open"
    @update:open="!loading && emit('update:open', $event)"
  >
    <AlertDialogPortal>
      <AlertDialogOverlay
        :class="mergeClasses('fixed inset-0 bg-black/45', ui.overlay)"
        :style="overlayStyle"
      />
      <AlertDialogContent
        v-bind="{ ...$attrs, class: undefined }"
        :style="contentStyle"
        :class="
          mergeClasses(
            'fixed top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-floating bg-modal p-5 shadow-floating outline-none sm:p-6',
            ui.content,
            $attrs.class,
          )
        "
      >
        <AlertDialogTitle
          :class="mergeClasses('text-lg font-medium text-ink', ui.title)"
        >
          {{ title }}
        </AlertDialogTitle>
        <AlertDialogDescription
          :class="
            mergeClasses('mt-2 text-sm leading-6 text-muted', ui.description)
          "
        >
          {{ description }}
        </AlertDialogDescription>
        <div :class="mergeClasses('mt-6 flex justify-end gap-3', ui.actions)">
          <AlertDialogCancel as-child>
            <XButton
              :class="mergeClasses(ui.cancel)"
              variant="outline"
              :disabled="loading"
            >
              取消
            </XButton>
          </AlertDialogCancel>
          <XButton
            :class="mergeClasses(ui.confirm)"
            :variant="danger ? 'danger' : 'primary'"
            :disabled="loading"
            @click="confirm"
          >
            {{ loading ? '处理中…' : confirmLabel }}
          </XButton>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
