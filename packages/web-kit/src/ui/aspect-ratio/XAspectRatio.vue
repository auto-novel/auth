<script setup lang="ts">
import { AspectRatio } from 'reka-ui';
import { mergeClasses } from '../classes';

import type { XAspectRatioProps } from './types';

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<XAspectRatioProps>(), { ratio: 1 });
</script>

<template>
  <AspectRatio
    v-bind="{ ...$attrs, class: undefined }"
    :ratio="ratio"
    :class="mergeClasses($attrs.class)"
  >
    <slot />
  </AspectRatio>
</template>
