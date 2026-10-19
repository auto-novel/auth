<script setup lang="ts">
import { TabsContent } from 'reka-ui';

import { mergeClasses } from '../classes';

import type { XTabsContentProps } from './types';

defineOptions({ inheritAttrs: false });

defineProps<XTabsContentProps>();
</script>

<template>
  <TabsContent
    v-bind="{ ...$attrs, class: undefined }"
    :value="value"
    :force-mount="forceMount"
    :class="
      mergeClasses(
        'min-w-0 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 data-[state=inactive]:hidden',
        $attrs.class,
      )
    "
  >
    <slot />
  </TabsContent>
</template>
