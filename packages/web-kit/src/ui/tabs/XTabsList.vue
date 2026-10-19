<script setup lang="ts">
import { TabsList } from 'reka-ui';

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
        'flex shrink-0 gap-1 border-divider data-[orientation=horizontal]:border-b data-[orientation=vertical]:flex-col data-[orientation=vertical]:border-r',
        $attrs.class,
      )
    "
  >
    <slot />
  </TabsList>
</template>
