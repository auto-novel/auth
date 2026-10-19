<script setup lang="ts">
import { Separator } from 'reka-ui';

import type { XSeparatorProps } from './types';

withDefaults(defineProps<XSeparatorProps>(), {
  orientation: 'horizontal',
  decorative: true,
});
</script>

<template>
  <Separator
    :orientation="orientation"
    :decorative="decorative"
    class="shrink-0 bg-divider data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px"
  />
</template>
