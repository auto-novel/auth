<script setup lang="ts">
import { useAdminKit } from '@novelia/admin-kit';
import type { AuthSettings, DailyAuthStat } from '@novelia/auth-api';
import { NAlert, NButton, NSpin, NTag, NText } from 'naive-ui';
import { onMounted, ref } from 'vue';

import OverviewMetrics from './OverviewMetrics.vue';
import OverviewSystemStatus from './OverviewSystemStatus.vue';
import OverviewTrend from './OverviewTrend.vue';

const DAYS = 7;
const TIME_ZONE = 'Asia/Shanghai';

const { api } = useAdminKit();
const authActivity = ref<DailyAuthStat[]>([]);
const settings = ref<AuthSettings | null>(null);
const loading = ref(true);
const errorMessage = ref('');

function formatDate(date: Date) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function getDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (DAYS - 1));
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

const dateRange = getDateRange();

async function loadOverview() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const [overview, authSettings] = await Promise.all([
      api.admin.getOverview(dateRange.startDate, dateRange.endDate),
      api.admin.getAuthSettings(),
    ]);
    authActivity.value = overview.authActivity;
    settings.value = authSettings;
  } catch (error) {
    authActivity.value = [];
    settings.value = null;
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    loading.value = false;
  }
}

onMounted(loadOverview);
</script>

<template>
  <main class="overview-page">
    <section class="intro" aria-labelledby="overview-title">
      <div>
        <n-text id="overview-title" tag="h1" class="intro-title">
          登录与注册统计
        </n-text>
        <n-text depth="3">展示最近 7 天的认证活动。</n-text>
      </div>
      <n-tag :bordered="false" round>
        {{ dateRange.startDate }} 至 {{ dateRange.endDate }}
      </n-tag>
    </section>

    <n-alert v-if="errorMessage" type="error" title="概览数据加载失败">
      <div class="error-content">
        <n-text>{{ errorMessage }}</n-text>
        <n-button size="small" @click="loadOverview">重新加载</n-button>
      </div>
    </n-alert>

    <n-spin v-else :show="loading">
      <div class="overview-grid">
        <OverviewMetrics class="metrics-panel" :activity="authActivity" />
        <OverviewTrend class="trend-panel" :activity="authActivity" />
        <OverviewSystemStatus
          v-if="settings"
          class="status-panel"
          :settings="settings"
        />
      </div>
    </n-spin>
  </main>
</template>

<style scoped>
.overview-page {
  --login: #3b82f6;
  --register: #18a058;
  max-width: 1000px;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.intro {
  min-height: 52px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}
.intro-title {
  display: block;
  margin: 0 0 5px;
  font-size: 22px;
  line-height: 1.35;
  font-weight: 650;
}
.error-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-areas: 'trend metrics';
  gap: 16px;
}
.metrics-panel {
  grid-area: metrics;
}
.trend-panel {
  grid-area: trend;
}
.status-panel {
  grid-column: 1 / -1;
}

@media (max-width: 767px) {
  .overview-grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'metrics' 'trend';
  }
}
@media (max-width: 599px) {
  .overview-page {
    gap: 16px;
  }
  .intro {
    min-height: auto;
    gap: 10px;
  }
  .intro-title {
    white-space: nowrap;
  }
  .intro > .n-tag {
    flex-shrink: 0;
    white-space: nowrap;
    font-size: 11px;
  }
}
</style>
