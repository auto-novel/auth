<script setup lang="ts">
import {
  DrawerContent,
  DrawerDescription,
  DrawerOverlay,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from 'reka-ui';
import { computed, shallowRef, watch } from 'vue';

import type { XDrawerProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<XDrawerProps>(), {
  side: 'right',
  width: 280,
  height: 280,
});

const emit = defineEmits<{
  'update:open': [open: boolean];
}>();

const horizontal = computed(
  () => props.side === 'left' || props.side === 'right',
);
const swipeDirection = computed(() =>
  props.side === 'top' ? 'up' : props.side === 'bottom' ? 'down' : props.side,
);
const panelStyle = computed(() => {
  const size = horizontal.value ? props.width : props.height;
  const length = typeof size === 'number' ? `${size}px` : size;
  const exit = props.side === 'left' || props.side === 'top' ? '-100%' : '100%';
  return {
    width: horizontal.value ? length : '100%',
    height: horizontal.value ? '100%' : length,
    '--x-drawer-exit-x': horizontal.value ? exit : '0px',
    '--x-drawer-exit-y': horizontal.value ? '0px' : exit,
  };
});

// 没有 #trigger 时，Drawer 不会自动记录外部打开按钮。
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
  { flush: 'sync', immediate: true },
);
</script>

<template>
  <DrawerRoot
    :open="open"
    :swipe-direction="swipeDirection"
    @update:open="emit('update:open', $event)"
  >
    <DrawerTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DrawerTrigger>
    <DrawerPortal>
      <Transition
        enter-active-class="transition-opacity duration-200 motion-reduce:transition-none"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-200 motion-reduce:transition-none"
        leave-to-class="opacity-0"
      >
        <DrawerOverlay class="fixed inset-0 z-50 bg-black/40" />
      </Transition>
      <Transition
        enter-from-class="x-drawer-offscreen"
        leave-to-class="x-drawer-offscreen"
      >
        <DrawerContent
          v-bind="{
            ...$attrs,
            ...(description ? {} : { 'aria-describedby': undefined }),
          }"
          :final-focus="returnFocus ?? true"
          class="x-drawer-panel fixed z-50 flex flex-col overflow-hidden bg-modal text-ink shadow-2xl outline-none"
          :class="{
            'inset-y-0 left-0 max-w-[calc(100vw-3rem)]': side === 'left',
            'inset-y-0 right-0 max-w-[calc(100vw-3rem)]': side === 'right',
            'inset-x-0 top-0 max-h-[calc(100dvh-3rem)]': side === 'top',
            'inset-x-0 bottom-0 max-h-[calc(100dvh-3rem)]': side === 'bottom',
          }"
          :style="panelStyle"
        >
          <header
            v-if="showHeader"
            class="flex shrink-0 items-center justify-between gap-3 border-b border-divider px-6 py-4 leading-none"
          >
            <slot name="header">
              <DrawerTitle
                class="flex min-h-9 items-center text-lg leading-none font-medium"
              >
                {{ title }}
              </DrawerTitle>
              <div v-if="$slots.action" class="flex items-center gap-3">
                <slot name="action" />
              </div>
            </slot>
          </header>
          <DrawerTitle v-if="!showHeader || $slots.header" class="sr-only">
            {{ title }}
          </DrawerTitle>
          <DrawerDescription v-if="description" class="sr-only">
            {{ description }}
          </DrawerDescription>
          <slot />
        </DrawerContent>
      </Transition>
    </DrawerPortal>
  </DrawerRoot>
</template>

<style scoped>
.x-drawer-panel {
  transform: translate(
    var(--drawer-swipe-movement-x, 0px),
    var(--drawer-swipe-movement-y, 0px)
  );
  transition: transform 200ms ease-out;
}

.x-drawer-panel[data-swiping] {
  transition: none;
}

.x-drawer-panel.x-drawer-offscreen {
  transform: translate(var(--x-drawer-exit-x), var(--x-drawer-exit-y));
}

@media (prefers-reduced-motion: reduce) {
  .x-drawer-panel {
    transition: none;
  }
}
</style>
