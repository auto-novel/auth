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
      class="floating-panel pointer-events-auto flex max-w-full items-center gap-2.5 px-5 py-2.5 outline-none data-[swipe=cancel]:translate-y-0 data-[swipe=end]:translate-y-(--reka-toast-swipe-end-y) data-[swipe=move]:translate-y-(--reka-toast-swipe-move-y) data-[swipe=cancel]:transition-transform data-[swipe=end]:transition-transform"
      @update:open="
        (open) => {
          if (!open) dismiss(notification.id);
        }
      "
    >
      <CheckCircleOutlineOutlined
        v-if="notification.type === 'success'"
        class="size-5 flex-none text-success"
        aria-hidden="true"
      />
      <ErrorOutlineOutlined
        v-else
        class="size-5 flex-none text-error"
        aria-hidden="true"
      />
      <ToastDescription
        class="min-w-0 flex-1 text-sm font-normal whitespace-pre-wrap wrap-anywhere text-ink"
      >
        {{ notification.message }}
      </ToastDescription>
    </ToastRoot>

    <ToastPortal>
      <ToastViewport
        class="pointer-events-none fixed top-3 left-1/2 z-100 flex max-h-[calc(100vh-2rem)] w-max max-w-[calc(100%-2rem)] -translate-x-1/2 flex-col items-center gap-2 outline-none sm:max-w-[min(720px,calc(100%-2rem))]"
        label="通知（{hotkey}）"
      />
    </ToastPortal>
  </ToastProvider>
</template>
