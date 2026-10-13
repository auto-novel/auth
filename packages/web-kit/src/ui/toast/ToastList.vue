<script setup lang="ts">
import {
  CheckCircleOutlineOutlined,
  ErrorOutlineOutlined,
  LoopOutlined,
} from '@vicons/material';
import {
  ToastDescription,
  ToastPortal,
  ToastRoot,
  ToastViewport,
  useToastManager,
} from 'reka-ui';

const { toasts } = useToastManager();
</script>

<template>
  <ToastRoot
    v-for="notification in toasts"
    :key="notification.id"
    :toast="notification"
    class="floating-panel pointer-events-auto flex max-w-full items-center gap-2.5 px-5 py-2.5 outline-none data-[swipe=cancel]:translate-y-0 data-[swipe=end]:translate-y-(--reka-toast-swipe-end-y) data-[swipe=move]:translate-y-(--reka-toast-swipe-move-y) data-[swipe=cancel]:transition-transform data-[swipe=end]:transition-transform"
  >
    <LoopOutlined
      v-if="notification.status === 'loading'"
      class="size-5 flex-none animate-spin text-muted motion-reduce:animate-none"
      aria-hidden="true"
    />
    <CheckCircleOutlineOutlined
      v-else-if="notification.status === 'success'"
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
    />
  </ToastRoot>

  <ToastPortal>
    <ToastViewport
      class="pointer-events-none fixed top-3 left-1/2 z-100 flex max-h-[calc(100vh-2rem)] w-max max-w-[calc(100%-2rem)] -translate-x-1/2 flex-col items-center gap-2 outline-none sm:max-w-[min(720px,calc(100%-2rem))]"
      label="通知（{hotkey}）"
    />
  </ToastPortal>
</template>
