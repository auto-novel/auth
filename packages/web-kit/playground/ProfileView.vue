<script setup lang="ts">
import { useWebKit } from '@novelia/web-kit';

const { whoami } = useWebKit();
</script>

<template>
  <div class="page-container flex flex-col gap-4 py-6">
    <h1 class="text-lg font-medium">个人资料</h1>
    <p class="text-sm">
      登录状态：{{ whoami.isSignedIn ? (whoami.user?.username ?? '已登录') : '未登录' }}
    </p>
    <p class="text-muted text-sm">
      这个路由只用来验证布局内的页面切换、滚动复位和侧栏选中态。
    </p>
  </div>
</template>
