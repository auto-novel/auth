<script setup lang="ts">
import {
  CheckCircleOutlineOutlined,
  ErrorOutlineOutlined,
  InfoOutlined,
  WarningAmberOutlined,
  CloseOutlined,
  LoopOutlined,
} from '@vicons/material';
import {
  ToastClose,
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
    class="web-kit-toast-notification floating-panel pointer-events-auto flex max-w-full items-center gap-2.5 px-5 py-2.5 outline-none"
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
    <InfoOutlined
      v-else-if="notification.status === 'info'"
      class="size-5 flex-none text-info"
      aria-hidden="true"
    />
    <WarningAmberOutlined
      v-else-if="notification.status === 'warning'"
      class="size-5 flex-none text-warning"
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
    <ToastClose
      aria-label="关闭通知"
      class="flex size-6 flex-none cursor-pointer items-center justify-center rounded text-muted hover:bg-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
    >
      <CloseOutlined class="size-4" aria-hidden="true" />
    </ToastClose>
  </ToastRoot>

  <ToastPortal>
    <ToastViewport
      class="pointer-events-none fixed top-3 left-1/2 z-100 flex max-h-[calc(100vh-2rem)] w-max max-w-[calc(100%-2rem)] -translate-x-1/2 flex-col items-center gap-2 outline-none sm:max-w-[min(720px,calc(100%-2rem))]"
      label="通知（{hotkey}）"
    />
  </ToastPortal>
</template>

<style>
.web-kit-toast-notification[data-state='open'] {
  animation: web-kit-toast-enter 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.web-kit-toast-notification[data-state='closed'] {
  animation: web-kit-toast-leave 160ms ease-in forwards;
}

.web-kit-toast-notification[data-swipe='move'] {
  animation: none;
  transform: translateY(var(--reka-toast-swipe-move-y));
}

.web-kit-toast-notification[data-swipe='cancel'] {
  transform: translateY(0);
  transition: transform 180ms ease-out;
}

.web-kit-toast-notification[data-swipe='end'] {
  animation: web-kit-toast-swipe-out 160ms ease-out forwards;
}

@keyframes web-kit-toast-enter {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes web-kit-toast-leave {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}

@keyframes web-kit-toast-swipe-out {
  from {
    opacity: 1;
    transform: translateY(var(--reka-toast-swipe-end-y));
  }
  to {
    opacity: 0;
    transform: translateY(calc(var(--reka-toast-swipe-end-y) - 24px));
  }
}

@media (prefers-reduced-motion: reduce) {
  .web-kit-toast-notification[data-state] {
    animation: none;
    transition: none;
  }
}
</style>
