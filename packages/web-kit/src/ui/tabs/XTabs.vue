<script setup lang="ts">
import { TabsRoot } from 'reka-ui';

import type { XTabsProps, XTabsValue } from './types';

withDefaults(defineProps<Omit<XTabsProps, 'modelValue'>>(), {
  orientation: 'horizontal',
  activationMode: 'automatic',
});

const model = defineModel<XTabsValue>();
</script>

<template>
  <TabsRoot
    v-model="model"
    :default-value="defaultValue"
    :orientation="orientation"
    :activation-mode="activationMode"
    class="flex min-w-0 flex-col gap-4 data-[orientation=vertical]:flex-row"
  >
    <slot />
  </TabsRoot>
</template>
