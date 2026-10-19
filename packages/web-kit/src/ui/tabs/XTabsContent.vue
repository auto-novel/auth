<script setup lang="ts">
import { TabsContent } from 'reka-ui';

import type { XTabsContentProps } from './types';

defineProps<XTabsContentProps>();
</script>

<template>
  <TabsContent
    :value="value"
    :force-mount="forceMount"
    class="min-w-0 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 data-[state=inactive]:hidden"
  >
    <slot />
  </TabsContent>
</template>
