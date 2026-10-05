<script setup lang="ts">
import {
  CheckCircleOutlineOutlined,
  ErrorOutlineOutlined,
} from '@vicons/material';
import {
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastRoot,
  ToastViewport,
} from 'reka-ui';

import { notifications } from './index';

// `items` 需要解构到顶层，模板才会自动解包这个 ref。
const { items, dismiss } = notifications;
</script>

<template>
  <ToastProvider
    label="通知"
    :duration="4000"
    swipe-direction="up"
    :swipe-threshold="40"
  >
    <ToastRoot
      v-for="notification in items"
      :key="notification.id"
      class="flex w-full items-center gap-2.5 rounded-md border border-border bg-surface px-4 py-2.5 shadow-lg outline-none data-[swipe=cancel]:translate-y-0 data-[swipe=end]:translate-y-[var(--reka-toast-swipe-end-y)] data-[swipe=move]:translate-y-[var(--reka-toast-swipe-move-y)] data-[swipe=cancel]:transition-transform data-[swipe=end]:transition-transform"
      @update:open="
        (open) => {
          if (!open) dismiss(notification.id);
        }
      "
    >
      <CheckCircleOutlineOutlined
        v-if="notification.type === 'success'"
        class="size-5 flex-none text-green-600"
        aria-hidden="true"
      />
      <ErrorOutlineOutlined
        v-else
        class="size-5 flex-none text-red-600"
        aria-hidden="true"
      />
      <ToastDescription class="min-w-0 flex-1 text-sm font-medium text-ink">
        {{ notification.message }}
      </ToastDescription>
    </ToastRoot>

    <ToastPortal>
      <ToastViewport
        class="fixed top-4 left-1/2 z-[100] flex max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 outline-none"
        label="通知（{hotkey}）"
      />
    </ToastPortal>
  </ToastProvider>
</template>
