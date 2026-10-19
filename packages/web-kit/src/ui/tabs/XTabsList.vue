<script setup lang="ts">
import { TabsList } from 'reka-ui';

import type { XTabsListProps } from './types';

withDefaults(defineProps<XTabsListProps>(), { loop: true });
</script>

<template>
  <TabsList
    :loop="loop"
    class="flex shrink-0 gap-1 border-divider data-[orientation=horizontal]:border-b data-[orientation=vertical]:flex-col data-[orientation=vertical]:border-r"
  >
    <slot />
  </TabsList>
</template>
