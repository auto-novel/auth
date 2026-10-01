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

withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    loading?: boolean;
    danger?: boolean;
  }>(),
  {
    confirmLabel: '确认',
  },
);

const emit = defineEmits<{
  'update:open': [open: boolean];
  confirm: [];
}>();

function confirm() {
  // 先执行确认，再关闭弹窗，避免父组件提前清空待执行的动作。
  emit('confirm');
  emit('update:open', false);
}
</script>

<template>
  <AlertDialogRoot :open="open" @update:open="$emit('update:open', $event)">
    <AlertDialogPortal>
      <AlertDialogOverlay class="fixed inset-0 z-40 bg-black/45" />
      <AlertDialogContent
        class="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-surface p-5 shadow-2xl outline-none sm:p-6"
      >
        <AlertDialogTitle class="text-lg font-semibold text-ink">
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
