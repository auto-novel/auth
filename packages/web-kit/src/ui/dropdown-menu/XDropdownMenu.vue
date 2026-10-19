<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui';

import { useOverlayLayer } from '../overlayLayer';
import type { XDropdownMenuProps } from './types';

// Fallthrough attributes (class, aria-label, content events, etc.) belong to
// the portalled menu; trigger attributes belong on the trigger slot child.
defineOptions({ inheritAttrs: false });

withDefaults(defineProps<Omit<XDropdownMenuProps, 'open'>>(), {
  side: 'bottom',
  align: 'end',
  sideOffset: 6,
  disabled: false,
  modal: true,
});

const open = defineModel<boolean>('open', { default: false });
const { contentStyle } = useOverlayLayer(open);
</script>

<template>
  <DropdownMenuRoot v-model:open="open" :modal="modal">
    <DropdownMenuTrigger as-child :disabled="disabled">
      <slot name="trigger" :open="open" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        v-bind="$attrs"
        :style="contentStyle"
        :side="side"
        :align="align"
        :side-offset="sideOffset"
        :collision-padding="8"
        class="floating-panel min-w-40 p-1 text-ink outline-none"
        :class="contentClass"
      >
        <slot :open="open" />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
