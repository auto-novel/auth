<script setup lang="ts">
import { MoreHorizOutlined } from '@vicons/material';
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui';

import XButton from './XButton.vue';

withDefaults(
  defineProps<{
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
    compact?: boolean;
  }>(),
  {
    side: 'bottom',
    align: 'end',
  },
);
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <XButton
        variant="ghost"
        :size="compact ? 'icon-xs' : 'icon'"
        aria-label="更多操作"
        title="更多操作"
      >
        <MoreHorizOutlined
          :class="compact ? 'size-4' : 'size-5'"
          aria-hidden="true"
        />
      </XButton>
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        :side="side"
        :align="align"
        :side-offset="6"
        :collision-padding="8"
        class="z-30 rounded-md border border-border bg-surface p-1 shadow-xl outline-none"
        :class="compact ? 'w-32' : 'w-40'"
      >
        <slot />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
