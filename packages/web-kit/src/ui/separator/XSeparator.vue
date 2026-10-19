<script setup lang="ts">
import { Separator } from 'reka-ui';

import { mergeClasses } from '../classes';

import type { XSeparatorProps } from './types';

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<XSeparatorProps>(), {
  orientation: 'horizontal',
  decorative: true,
});
</script>

<template>
  <Separator
    v-bind="{ ...$attrs, class: undefined }"
    :orientation="orientation"
    :decorative="decorative"
    :class="
      mergeClasses(
        'shrink-0 bg-divider data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        $attrs.class,
      )
    "
  />
</template>
