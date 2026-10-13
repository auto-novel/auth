<script setup lang="ts">
import { ToastProvider } from 'reka-ui';

import { toastManager } from './index';
import ToastList from './ToastList.vue';
</script>

<template>
  <ToastProvider
    :toast-manager="toastManager"
    label="通知"
    :duration="4000"
    swipe-direction="up"
    :swipe-threshold="40"
  >
    <ToastList />
  </ToastProvider>
</template>
