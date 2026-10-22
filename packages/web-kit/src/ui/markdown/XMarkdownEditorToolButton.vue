<script setup lang="ts">
import XButton from '../button/XButton.vue';
import { mergeClasses } from '../classes';
import XTooltip from '../tooltip/XTooltip.vue';
import type { XMarkdownEditorToolButtonProps } from './types';

defineOptions({ inheritAttrs: false });
defineProps<XMarkdownEditorToolButtonProps>();
</script>

<template>
  <XTooltip>
    <template #trigger>
      <XButton
        v-bind="{ ...$attrs, class: undefined }"
        type="button"
        color="neutral"
        variant="ghost"
        size="icon-sm"
        :disabled="disabled"
        :aria-label="label"
        :class="
          mergeClasses(
            'text-ink hover:bg-divider/40 hover:text-ink',
            $attrs.class,
          )
        "
        @mousedown.prevent
      >
        <slot />
      </XButton>
    </template>
    {{ label }}
  </XTooltip>
</template>
