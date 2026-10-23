<script setup lang="ts">
import { XButton } from '@novelia/web-kit';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import StatusTag from '@/components/StatusTag.vue';
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
  <section class="status-card rounded-[3px] border border-divider bg-surface">
    <header class="flex items-center gap-4 px-6 pt-[19px] pb-3">
      <div class="min-w-0 flex-1 text-lg font-medium text-ink">系统状态</div>
      <RouterLink v-slot="{ navigate }" to="/settings" custom>
        <XButton
          color="neutral"
          variant="ghost"
          size="sm"
          class="text-primary"
          @click="navigate"
        >
          管理设置
        </XButton>
      </RouterLink>
    </header>

    <div
      class="grid grid-cols-2 px-6 pt-2 pb-2 [@media(max-width:599px)]:grid-cols-1"
    >
      <div
        v-for="feature in features"
        :key="feature.label"
        class="status-row flex min-w-0 items-center justify-between gap-4 px-5 py-3 [@media(max-width:599px)]:px-0"
      >
        <div class="flex min-w-0 flex-col gap-1">
          <strong class="font-semibold text-ink">{{ feature.label }}</strong>
          <span class="text-muted">{{ feature.description }}</span>
        </div>
        <StatusTag
          :tone="feature.enabled ? 'success' : 'error'"
          size="md"
          round
        >
          {{ feature.enabled ? '已启用' : '已停用' }}
        </StatusTag>
      </div>
    </div>

    <footer class="px-6 pt-3 pb-5 text-xs text-muted">
      最近更新：{{ updatedAt }}
    </footer>
  </section>
</template>

<style scoped>
.status-row + .status-row {
  border-left: 1px solid var(--color-divider);
}

@media (max-width: 599px) {
  .status-row + .status-row {
    border-top: 1px solid var(--color-divider);
    border-left: 0;
  }
}
</style>
