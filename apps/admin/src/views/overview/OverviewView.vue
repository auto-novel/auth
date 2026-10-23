<script setup lang="ts">
import { getApiErrorMessage, XAsyncContent } from '@novelia/web-kit';
import type {
  AuthActivitySummary,
  AuthSettings,
  DailyAuthStat,
  OverviewUserSummary as UserSummary,
} from '@/api';
import { onMounted, ref } from 'vue';

import { useAdminApi } from '@/api';

import OverviewMetrics from './OverviewMetrics.vue';
import OverviewSystemStatus from './OverviewSystemStatus.vue';
import OverviewTrend from './OverviewTrend.vue';
import OverviewUserSummary from './OverviewUserSummary.vue';

const DAYS = 7;
const TIME_ZONE = 'Asia/Shanghai';

const api = useAdminApi();
const authActivity = ref<DailyAuthStat[]>([]);
const activitySummary = ref<AuthActivitySummary>({
  loginCount: 0,
  newUsers: 0,
});
const previousActivitySummary = ref<AuthActivitySummary>({
  loginCount: 0,
  newUsers: 0,
});
const userSummary = ref<UserSummary | null>(null);
const settings = ref<AuthSettings | null>(null);
const activityLoading = ref(true);
const userSummaryLoading = ref(true);
const settingsLoading = ref(true);
const activityError = ref('');
const userSummaryError = ref('');
const settingsError = ref('');

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

async function loadActivity() {
  activityLoading.value = true;
  activityError.value = '';

  try {
    const activity = await api.admin.getOverviewActivity(
      dateRange.startDate,
      dateRange.endDate,
    );
    authActivity.value = activity.authActivity;
    activitySummary.value = activity.summary;
    previousActivitySummary.value = activity.previousSummary;
  } catch (error) {
    authActivity.value = [];
    activitySummary.value = { loginCount: 0, newUsers: 0 };
    previousActivitySummary.value = { loginCount: 0, newUsers: 0 };
    activityError.value = getApiErrorMessage(error, '无法加载认证活动');
  } finally {
    activityLoading.value = false;
  }
}

async function loadUserSummary() {
  userSummaryLoading.value = true;
  userSummaryError.value = '';

  try {
    userSummary.value = await api.admin.getOverviewUserSummary();
  } catch (error) {
    userSummary.value = null;
    userSummaryError.value = getApiErrorMessage(error, '无法加载用户概况');
  } finally {
    userSummaryLoading.value = false;
  }
}

async function loadSettings() {
  settingsLoading.value = true;
  settingsError.value = '';

  try {
    settings.value = await api.admin.getAuthSettings();
  } catch (error) {
    settings.value = null;
    settingsError.value = getApiErrorMessage(error, '无法加载设置');
  } finally {
    settingsLoading.value = false;
  }
}

onMounted(() => {
  void loadActivity();
  void loadUserSummary();
  void loadSettings();
});
</script>

<template>
  <main class="overview-page">
    <XAsyncContent
      :loading="activityLoading"
      :error="activityError"
      error-title="认证活动加载失败"
      retry-label="重新加载"
      :on-retry="loadActivity"
    >
      <div class="overview-grid">
        <OverviewMetrics
          class="metrics-panel"
          :summary="activitySummary"
          :previous-summary="previousActivitySummary"
        />
        <OverviewTrend
          class="trend-panel"
          :activity="authActivity"
          :start-date="dateRange.startDate"
          :end-date="dateRange.endDate"
        />
      </div>
    </XAsyncContent>

    <div class="snapshot-grid">
      <div class="snapshot-content">
        <XAsyncContent
          :loading="userSummaryLoading"
          :error="userSummaryError"
          error-title="用户概况加载失败"
          retry-label="重新加载"
          :on-retry="loadUserSummary"
          size="compact"
        >
          <OverviewUserSummary v-if="userSummary" :summary="userSummary" />
        </XAsyncContent>
      </div>

      <div class="snapshot-content">
        <XAsyncContent
          :loading="settingsLoading"
          :error="settingsError"
          error-title="系统状态加载失败"
          retry-label="重新加载"
          :on-retry="loadSettings"
          size="compact"
        >
          <OverviewSystemStatus v-if="settings" :settings="settings" />
        </XAsyncContent>
      </div>
    </div>
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
.snapshot-content {
  min-height: 120px;
}
.snapshot-grid {
  display: grid;
  gap: 16px;
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
}
</style>
