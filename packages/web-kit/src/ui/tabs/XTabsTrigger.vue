<script setup lang="ts">
import { TabsTrigger } from 'reka-ui';

import { mergeClasses } from '../classes';

import type { XTabsTriggerProps } from './types';

defineOptions({ inheritAttrs: false });

defineProps<XTabsTriggerProps>();
</script>

<template>
  <TabsTrigger
    v-bind="{ ...$attrs, class: undefined }"
    :value="value"
    :disabled="disabled"
    :class="
      mergeClasses(
        'cursor-pointer border-transparent px-4 py-2 text-sm text-muted outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 data-[orientation=horizontal]:-mb-px data-[orientation=horizontal]:border-b-2 data-[orientation=vertical]:-mr-px data-[orientation=vertical]:border-r-2 data-[state=active]:text-primary motion-reduce:transition-none',
        $attrs.class,
      )
    "
  >
    <slot />
  </TabsTrigger>
</template>
