<script setup lang="ts">
import { useAdminKit } from '@novelia/admin-kit';
import { NAlert, NCard, NDescriptions, NDescriptionsItem, NStatistic } from 'naive-ui';

const { options, isSignedIn, isAuthorized, profile } = useAdminKit();
</script>

<template>
  <div class="page">
    <n-alert type="info" :show-icon="true">
      playground 只连线上登录页，不会真的拿到会话，所以这里通常是未登录状态；布局、侧栏、主题切换和账号菜单仍可正常调试。
    </n-alert>

    <n-card title="会话">
      <n-descriptions :column="2" label-placement="left">
        <n-descriptions-item label="登录状态">
          {{ isSignedIn ? (profile?.username ?? '已登录') : '未登录' }}
        </n-descriptions-item>
        <n-descriptions-item label="管理员权限">
          {{ isAuthorized ? '有' : '无' }}
        </n-descriptions-item>
        <n-descriptions-item label="auth.app">
          {{ options.auth.app }}
        </n-descriptions-item>
        <n-descriptions-item label="auth.url">
          {{ options.auth.url }}
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <n-card title="统计">
      <div class="stats">
        <n-statistic label="用户" :value="128" />
        <n-statistic label="今日登录" :value="36" />
        <n-statistic label="处罚记录" :value="4" />
      </div>
    </n-card>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
}
</style>
