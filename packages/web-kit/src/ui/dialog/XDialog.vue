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
import {
  ref,
  shallowRef,
  useAttrs,
  useSlots,
  watch,
  type CSSProperties,
} from 'vue';

import { useOverlayLayer } from '../overlayLayer';
import type { XDialogProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<XDialogProps>(), {
  fullScreen: false,
  scrollable: true,
  closable: true,
  closeLabel: '关闭窗口',
});
const emit = defineEmits<{
  'update:open': [open: boolean];
  openAutoFocus: [event: Event];
  closeAutoFocus: [event: Event];
}>();

const attrs = useAttrs();
const slots = useSlots();

function hasHeader() {
  return !!(
    props.title ||
    slots.title ||
    props.description ||
    slots.description
  );
}

// Keep explicit accessible names/descriptions; only omit Reka's automatic IDs
// when their corresponding semantic content is absent.
function dialogAttrs() {
  return {
    ...attrs,
    ...(!('aria-labelledby' in attrs) &&
    (attrs['aria-label'] || !(props.title || slots.title))
      ? { 'aria-labelledby': undefined }
      : {}),
    ...(!('aria-describedby' in attrs) &&
    !(props.description || slots.description)
      ? { 'aria-describedby': undefined }
      : {}),
  };
}

const { overlayStyle, contentStyle } = useOverlayLayer(() => props.open);
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
      <DialogOverlay class="fixed inset-0 bg-black/45" :style="overlayStyle" />
      <DialogContent
        v-bind="dialogAttrs()"
        aria-modal="true"
        class="fixed bg-modal text-ink outline-none"
        :class="
          fullScreen
            ? 'inset-0'
            : 'x-dialog-panel top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col rounded-floating shadow-floating'
        "
        :style="[viewportStyle, contentStyle]"
        @open-auto-focus="emit('openAutoFocus', $event)"
        @close-auto-focus="restoreFocus"
        @escape-key-down="!closable && $event.preventDefault()"
        @pointer-down-outside="!closable && $event.preventDefault()"
      >
        <header
          v-if="hasHeader()"
          :class="fullScreen ? 'sr-only' : 'shrink-0 px-5 pt-5 sm:px-6 sm:pt-6'"
        >
          <DialogTitle
            v-if="title || $slots.title"
            class="text-lg font-medium wrap-break-word"
            :class="closable && !fullScreen ? 'pr-10' : undefined"
          >
            <slot name="title">{{ title }}</slot>
          </DialogTitle>
          <DialogDescription
            v-if="description || $slots.description"
            class="text-sm leading-6 text-muted"
            :class="
              title || $slots.title ? 'mt-2' : closable ? 'pr-10' : undefined
            "
          >
            <slot name="description">{{ description }}</slot>
          </DialogDescription>
        </header>
        <!-- Reka expects a Title even when an external accessible name is used. -->
        <DialogTitle v-if="!title && !$slots.title" class="sr-only">
          {{ $attrs['aria-label'] }}
        </DialogTitle>
        <template v-if="fullScreen">
          <slot />
          <slot name="footer" />
        </template>
        <template v-else>
          <div
            v-if="$slots.default"
            class="x-dialog-body min-h-0 flex-1"
            :class="[
              scrollable
                ? 'overflow-y-auto overscroll-contain'
                : 'flex flex-col',
              !hasHeader() && closable ? 'x-dialog-close-space' : undefined,
              bodyClass,
            ]"
          >
            <slot />
          </div>
          <footer
            v-if="$slots.footer"
            class="flex shrink-0 flex-wrap items-center justify-end gap-3 pb-5 pl-5 sm:pb-6 sm:pl-6"
            :class="[
              !$slots.default ? 'pt-5 sm:pt-6' : undefined,
              !hasHeader() && !$slots.default && closable
                ? 'pr-14'
                : 'pr-5 sm:pr-6',
            ]"
          >
            <slot name="footer" />
          </footer>
        </template>
        <button
          v-if="closable"
          type="button"
          class="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-transparent text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :aria-label="closeLabel"
          @click="updateOpen(false)"
        >
          <CloseOutlined class="size-5" aria-hidden="true" />
        </button>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
