<script setup lang="ts">
import { NButton, NCard, NTag, NText } from 'naive-ui';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import type { AuthSettings } from '@/api';

const props = defineProps<{ settings: AuthSettings }>();

const updatedAt = computed(() => {
  if (!props.settings.updatedAt) return '尚未修改';

  const date = new Date(props.settings.updatedAt);
  if (Number.isNaN(date.getTime())) return props.settings.updatedAt;
  if (date.getUTCFullYear() <= 1) return '尚未修改';

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Asia/Shanghai',
  }).format(date);
});

const features = computed(() => [
  {
    label: '用户注册',
    description: props.settings.registerEnabled
      ? '新用户可以请求注册验证码并创建账号。'
      : '新用户无法请求注册验证码或创建账号。',
    enabled: props.settings.registerEnabled,
  },
  {
    label: '密码重置',
    description: props.settings.resetPasswordEnabled
      ? '用户可以请求验证码并重置密码。'
      : '用户无法请求验证码或提交新密码。',
    enabled: props.settings.resetPasswordEnabled,
  },
]);
</script>

<template>
  <n-card class="status-card" title="系统状态">
    <template #header-extra>
      <RouterLink v-slot="{ navigate }" to="/settings" custom>
        <n-button text type="primary" @click="navigate">管理设置</n-button>
      </RouterLink>
    </template>

    <div class="grid grid-cols-2 [@media(max-width:599px)]:grid-cols-1">
      <div
        v-for="feature in features"
        :key="feature.label"
        class="status-row flex min-w-0 items-center justify-between gap-4 px-5 py-3 [@media(max-width:599px)]:px-0"
      >
        <div class="flex min-w-0 flex-col gap-1">
          <n-text strong>{{ feature.label }}</n-text>
          <n-text depth="3">{{ feature.description }}</n-text>
        </div>
        <n-tag
          :bordered="false"
          :type="feature.enabled ? 'success' : 'error'"
          round
        >
          {{ feature.enabled ? '已启用' : '已停用' }}
        </n-tag>
      </div>
    </div>

    <template #footer>
      <n-text depth="3" class="text-[12px]!">最近更新：{{ updatedAt }}</n-text>
    </template>
  </n-card>
</template>

<style scoped>
.status-card :deep(.n-card-header) {
  padding-bottom: 12px;
}
.status-card :deep(.n-card__content) {
  padding-top: 8px;
  padding-bottom: 8px;
}
.status-card :deep(.n-card__footer) {
  padding-top: 12px;
}
.status-row + .status-row {
  border-left: 1px solid var(--n-border-color);
}

@media (max-width: 599px) {
  .status-row + .status-row {
    border-top: 1px solid var(--n-border-color);
    border-left: 0;
  }
}
</style>
