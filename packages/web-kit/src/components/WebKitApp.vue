<script setup lang="ts">
import { RouterView } from 'vue-router';

import XToaster from '../ui/toast/XToaster.vue';
import { useDialogPointerTracking } from '../ui/dialog/useDialogMotion';

useDialogPointerTracking();

defineOptions({ inheritAttrs: false });
</script>

<template>
  <slot>
    <RouterView />
  </slot>
  <XToaster />
</template>
