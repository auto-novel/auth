<script setup lang="ts">
import { AspectRatio } from 'reka-ui';
import type { XAspectRatioProps } from './types';

withDefaults(defineProps<XAspectRatioProps>(), { ratio: 1 });
</script>

<template>
  <AspectRatio :ratio="ratio">
    <slot />
  </AspectRatio>
</template>
