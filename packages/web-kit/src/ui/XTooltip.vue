<script setup lang="ts">
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui';

import type { XTooltipProps } from './types';

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<XTooltipProps>(), {
  side: 'top',
  align: 'center',
  sideOffset: 8,
  delayDuration: 200,
});
</script>

<template>
  <TooltipProvider :delay-duration="delayDuration">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <slot name="trigger" />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          v-bind="$attrs"
          :side="side"
          :align="align"
          :side-offset="sideOffset"
          :collision-padding="8"
          class="floating-panel z-50 px-3 py-2 text-xs text-ink"
        >
          <slot />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
