<script setup lang="ts">
import {
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from 'reka-ui';

import type { XScrollAreaProps } from './types';

withDefaults(defineProps<XScrollAreaProps>(), {
  orientation: 'vertical',
  type: 'auto',
  scrollHideDelay: 600,
});
</script>

<template>
  <ScrollAreaRoot
    :type="type"
    :scroll-hide-delay="scrollHideDelay"
    class="relative min-h-0 min-w-0 overflow-hidden"
  >
    <ScrollAreaViewport
      class="size-full rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
      :class="viewportClass"
    >
      <slot />
    </ScrollAreaViewport>
    <ScrollAreaScrollbar
      v-for="direction in orientation === 'both'
        ? (['vertical', 'horizontal'] as const)
        : [orientation]"
      :key="direction"
      :orientation="direction"
      class="flex touch-none rounded-full bg-hover p-px select-none"
      :class="direction === 'vertical' ? 'w-2' : 'h-2 flex-col'"
    >
      <ScrollAreaThumb
        class="relative flex-1 rounded-full bg-muted hover:bg-ink"
        :class="direction === 'vertical' ? 'min-h-6' : 'min-w-6'"
      />
    </ScrollAreaScrollbar>
    <ScrollAreaCorner class="bg-hover" />
  </ScrollAreaRoot>
</template>
