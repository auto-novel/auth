<script setup lang="ts">
import { TabsIndicator, TabsList } from 'reka-ui';

import { mergeClasses } from '../classes';

import type { XTabsListProps } from './types';

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<XTabsListProps>(), { loop: true });
</script>

<template>
  <TabsList
    v-bind="{ ...$attrs, class: undefined }"
    :loop="loop"
    :class="
      mergeClasses(
        'x-tabs-list relative flex shrink-0 gap-1 border-divider data-[orientation=horizontal]:border-b data-[orientation=vertical]:flex-col data-[orientation=vertical]:border-r',
        $attrs.class,
      )
    "
  >
    <slot />
    <TabsIndicator
      data-slot="tabs-indicator"
      aria-hidden="true"
      class="x-tabs-indicator pointer-events-none absolute bg-primary"
    />
  </TabsList>
</template>

<style scoped>
.x-tabs-indicator {
  transition:
    transform 200ms ease,
    width 200ms ease,
    height 200ms ease;
}

.x-tabs-list[data-orientation='horizontal'] > .x-tabs-indicator {
  bottom: -1px;
  left: 0;
  width: var(--reka-tabs-indicator-size);
  height: 2px;
  transform: translateX(var(--reka-tabs-indicator-position));
}

.x-tabs-list[data-orientation='vertical'] > .x-tabs-indicator {
  top: 0;
  right: -1px;
  width: 2px;
  height: var(--reka-tabs-indicator-size);
  transform: translateY(var(--reka-tabs-indicator-position));
}

@media (prefers-reduced-motion: reduce) {
  .x-tabs-indicator {
    transition: none;
  }
}
</style>
