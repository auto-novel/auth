<script setup lang="ts">
import { MoreVertOutlined } from '@vicons/material';
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui';
import { ref } from 'vue';

import { useOverlayLayer } from '../overlayLayer';

import XButton from '../button/XButton.vue';
import type { XActionMenuProps } from './types';

withDefaults(defineProps<XActionMenuProps>(), {
  side: 'bottom',
  align: 'end',
});
const open = ref(false);
const { contentStyle } = useOverlayLayer(open);
</script>

<template>
  <DropdownMenuRoot v-model:open="open">
    <DropdownMenuTrigger as-child>
      <XButton
        variant="ghost"
        :size="compact ? 'icon-xs' : 'icon'"
        aria-label="更多操作"
        title="更多操作"
      >
        <MoreVertOutlined
          :class="compact ? 'size-4' : 'size-5'"
          aria-hidden="true"
        />
      </XButton>
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        :style="contentStyle"
        :side="side"
        :align="align"
        :side-offset="6"
        :collision-padding="8"
        class="floating-panel p-1 outline-none"
        :class="compact ? 'w-32' : 'w-40'"
      >
        <slot />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
