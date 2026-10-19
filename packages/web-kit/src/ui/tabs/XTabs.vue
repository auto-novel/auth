<script setup lang="ts">
import { TabsRoot } from 'reka-ui';

import { mergeClasses } from '../classes';

import type { XTabsProps, XTabsValue } from './types';

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<Omit<XTabsProps, 'modelValue'>>(), {
  orientation: 'horizontal',
  activationMode: 'automatic',
});

const model = defineModel<XTabsValue>();
</script>

<template>
  <TabsRoot
    v-bind="{ ...$attrs, class: undefined }"
    v-model="model"
    :default-value="defaultValue"
    :orientation="orientation"
    :activation-mode="activationMode"
    :class="
      mergeClasses(
        'flex min-w-0 flex-col gap-4 data-[orientation=vertical]:flex-row',
        $attrs.class,
      )
    "
  >
    <slot />
  </TabsRoot>
</template>
