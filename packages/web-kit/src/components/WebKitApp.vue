<script setup lang="ts">
import { RouterView } from 'vue-router';

import GlobalNotifications from '../notifications/GlobalNotifications.vue';

defineOptions({ inheritAttrs: false });
</script>

<template>
  <slot>
    <RouterView />
  </slot>
  <GlobalNotifications />
</template>
