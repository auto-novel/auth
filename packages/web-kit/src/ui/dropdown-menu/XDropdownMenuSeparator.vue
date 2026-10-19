<script setup lang="ts">
import { DropdownMenuSeparator } from 'reka-ui';
import { mergeClasses } from '../classes';
defineOptions({ inheritAttrs: false });
</script>

<template>
  <DropdownMenuSeparator
    v-bind="{ ...$attrs, class: undefined }"
    :class="mergeClasses('-mx-1 my-1 h-px bg-border', $attrs.class)"
  />
</template>
