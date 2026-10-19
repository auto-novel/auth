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
import { mergeClasses } from '../classes';
import type { XActionMenuProps } from './types';

withDefaults(defineProps<XActionMenuProps>(), {
  ui: () => ({}),
  side: 'bottom',
  align: 'end',
});
const open = ref(false);
const { contentStyle } = useOverlayLayer(open);
defineOptions({ inheritAttrs: false });
</script>

<template>
  <DropdownMenuRoot v-model:open="open">
    <DropdownMenuTrigger as-child>
      <XButton
        :class="mergeClasses(ui.trigger)"
        variant="ghost"
        :size="compact ? 'icon-xs' : 'icon'"
        aria-label="更多操作"
        title="更多操作"
      >
        <MoreVertOutlined
          :class="mergeClasses(compact ? 'size-4' : 'size-5', ui.icon)"
          aria-hidden="true"
        />
      </XButton>
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        v-bind="{ ...$attrs, class: undefined }"
        :style="contentStyle"
        :side="side"
        :align="align"
        :side-offset="6"
        :collision-padding="8"
        :class="
          mergeClasses(
            'floating-panel p-1 outline-none',
            compact ? 'w-32' : 'w-40',
            ui.content,
            $attrs.class,
          )
        "
      >
        <slot />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
