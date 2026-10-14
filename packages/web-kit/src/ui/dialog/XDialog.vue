<script setup lang="ts">
import { CloseOutlined } from '@vicons/material';
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui';
import { ref, shallowRef, watch, type CSSProperties } from 'vue';

import type { XDialogProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<XDialogProps>(), {
  fullScreen: false,
  closable: true,
  closeLabel: '关闭窗口',
});
const emit = defineEmits<{
  'update:open': [open: boolean];
  openAutoFocus: [event: Event];
  closeAutoFocus: [event: Event];
}>();

const viewportStyle = ref<CSSProperties>({});
const returnFocus = shallowRef<HTMLElement | null>(null);

watch(
  () => props.open,
  (open) => {
    if (open && typeof document !== 'undefined') {
      returnFocus.value =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    }
  },
  { immediate: true, flush: 'sync' },
);

watch(
  [() => props.open, () => props.fullScreen],
  ([open, fullScreen], _, onCleanup) => {
    viewportStyle.value = {};
    if (!open || !fullScreen || typeof window === 'undefined') return;

    // 全屏内容跟随可见视口，避免移动端键盘遮挡。
    const viewport = window.visualViewport;
    if (!viewport) return;
    const synchronize = () => {
      viewportStyle.value = {
        top: `${viewport.offsetTop}px`,
        height: `${viewport.height}px`,
        bottom: 'auto',
      };
    };
    synchronize();
    viewport.addEventListener('resize', synchronize);
    viewport.addEventListener('scroll', synchronize);
    onCleanup(() => {
      viewport.removeEventListener('resize', synchronize);
      viewport.removeEventListener('scroll', synchronize);
    });
  },
  { immediate: true },
);

function updateOpen(open: boolean) {
  if (open || props.closable) emit('update:open', open);
}

function restoreFocus(event: Event) {
  emit('closeAutoFocus', event);
  if (event.defaultPrevented || !returnFocus.value?.isConnected) return;
  event.preventDefault();
  returnFocus.value.focus();
}
</script>

<template>
  <DialogRoot :open="open" @update:open="updateOpen">
    <DialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/45" />
      <DialogContent
        v-bind="{
          ...$attrs,
          ...(description ? {} : { 'aria-describedby': undefined }),
        }"
        aria-modal="true"
        class="fixed z-50 bg-modal text-ink outline-none"
        :class="
          fullScreen
            ? 'inset-0'
            : 'top-1/2 left-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-floating p-5 shadow-floating sm:p-6'
        "
        :style="viewportStyle"
        @open-auto-focus="emit('openAutoFocus', $event)"
        @close-auto-focus="restoreFocus"
        @escape-key-down="!closable && $event.preventDefault()"
        @pointer-down-outside="!closable && $event.preventDefault()"
      >
        <DialogTitle class="sr-only">{{ title }}</DialogTitle>
        <DialogDescription v-if="description" class="sr-only">
          {{ description }}
        </DialogDescription>
        <slot />
        <button
          v-if="closable"
          type="button"
          class="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-black/55 text-white transition hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          :aria-label="closeLabel"
          @click="updateOpen(false)"
        >
          <CloseOutlined class="size-5" aria-hidden="true" />
        </button>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
