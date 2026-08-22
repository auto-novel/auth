<script setup lang="ts">
import { NLayoutHeader, NText } from 'naive-ui';

defineProps<{
  collapsed: boolean;
  brand: string;
}>();
</script>

<template>
  <n-layout-header
    class="brand-header"
    :class="{ 'brand-header--collapsed': collapsed }"
  >
    <n-text type="primary" class="brand-logo" aria-hidden="true">
      <span class="brand-logo__image" />
    </n-text>
    <n-text class="brand-title">
      <span class="brand-title__brand">{{ brand }}</span>
      <n-text type="primary" class="brand-title__divider" aria-hidden="true" />
      <n-text type="primary" class="brand-title__text">Admin</n-text>
    </n-text>
  </n-layout-header>
</template>

<style scoped>
.brand-header { height: 64px; padding: 0 14px; display: flex; align-items: center; gap: 10px; transition: gap .3s var(--n-bezier), color .3s var(--n-bezier), background-color .3s var(--n-bezier), box-shadow .3s var(--n-bezier), border-color .3s var(--n-bezier); }
.brand-logo { height: 36px; flex: 0 0 36px; display: grid; place-items: center; }
.brand-logo__image { width: 32px; height: 32px; background-color: currentColor; -webkit-mask: url('../assets/robot.svg') center / contain no-repeat; mask: url('../assets/robot.svg') center / contain no-repeat; transition: background-color .3s var(--n-bezier); }
.brand-title { max-width: 112px; overflow: hidden; display: inline-flex; align-items: center; transform: translateY(2px); gap: 5px; font-size: 16px; line-height: 1; transition: max-width .3s ease, opacity .2s ease, color .3s var(--n-bezier); }
.brand-title__brand { font-weight: 800; letter-spacing: -.055em; }
.brand-title__divider { width: 4px; height: 4px; flex: none; border-radius: 1px; background-color: currentColor; transform: rotate(45deg); transition: background-color .3s var(--n-bezier); }
.brand-title__text { font-weight: 650; letter-spacing: -.025em; transition: color .3s var(--n-bezier); }
.brand-header--collapsed { gap: 0; }
.brand-header--collapsed .brand-title { max-width: 0; opacity: 0; }
</style>
