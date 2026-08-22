<script setup lang="ts">
import { darkTheme, NConfigProvider } from 'naive-ui';
import { RouterView } from 'vue-router';

import { useAdminTheme } from '../context';

const { isDark } = useAdminTheme();
</script>

<template>
  <n-config-provider :theme="isDark ? darkTheme : null">
    <slot>
      <router-view />
    </slot>
  </n-config-provider>
</template>

<style>
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
}

body {
  overflow: hidden;
}
</style>
