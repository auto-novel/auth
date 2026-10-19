<script setup lang="ts">
import {
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from 'reka-ui';

import { mergeClasses } from '../classes';

import type { XScrollAreaProps } from './types';

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<XScrollAreaProps>(), {
  orientation: 'vertical',
  type: 'auto',
  scrollHideDelay: 600,
  ui: () => ({}),
});
</script>

<template>
  <ScrollAreaRoot
    v-bind="{ ...$attrs, class: undefined }"
    :type="type"
    :scroll-hide-delay="scrollHideDelay"
    :class="
      mergeClasses(
        'relative min-h-0 min-w-0 overflow-hidden',
        ui.root,
        $attrs.class,
      )
    "
  >
    <ScrollAreaViewport
      :class="
        mergeClasses(
          'size-full rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30',
          ui.viewport,
        )
      "
    >
      <slot />
    </ScrollAreaViewport>
    <ScrollAreaScrollbar
      v-for="direction in orientation === 'both'
        ? (['vertical', 'horizontal'] as const)
        : [orientation]"
      :key="direction"
      :orientation="direction"
      :class="
        mergeClasses(
          'flex touch-none rounded-full bg-hover p-px select-none',
          direction === 'vertical' ? 'w-2' : 'h-2 flex-col',
          ui.scrollbar,
        )
      "
    >
      <ScrollAreaThumb
        :class="
          mergeClasses(
            'relative flex-1 rounded-full bg-muted hover:bg-ink',
            direction === 'vertical' ? 'min-h-6' : 'min-w-6',
            ui.thumb,
          )
        "
      />
    </ScrollAreaScrollbar>
    <ScrollAreaCorner :class="mergeClasses('bg-hover', ui.corner)" />
  </ScrollAreaRoot>
</template>
