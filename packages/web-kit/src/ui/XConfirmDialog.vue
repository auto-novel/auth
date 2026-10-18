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

import XButton from './XButton.vue';
import { useOverlayLayer } from './overlayLayer';
import type { XConfirmDialogProps } from './types';

const props = withDefaults(defineProps<XConfirmDialogProps>(), {
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
</script>

<template>
  <AlertDialogRoot
    :open="open"
    @update:open="!loading && emit('update:open', $event)"
  >
    <AlertDialogPortal>
      <AlertDialogOverlay
        class="fixed inset-0 bg-black/45"
        :style="overlayStyle"
      />
      <AlertDialogContent
        :style="contentStyle"
        class="fixed top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-floating bg-modal p-5 shadow-floating outline-none sm:p-6"
      >
        <AlertDialogTitle class="text-lg font-medium text-ink">
          {{ title }}
        </AlertDialogTitle>
        <AlertDialogDescription class="mt-2 text-sm leading-6 text-muted">
          {{ description }}
        </AlertDialogDescription>
        <div class="mt-6 flex justify-end gap-3">
          <AlertDialogCancel as-child>
            <XButton variant="outline" :disabled="loading">取消</XButton>
          </AlertDialogCancel>
          <XButton
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
