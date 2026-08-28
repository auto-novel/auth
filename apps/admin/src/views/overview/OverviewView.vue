<script setup lang="ts">
import { useAdminKit } from '@novelia/admin-kit';
import type {
  AuthActivitySummary,
  AuthSettings,
  DailyAuthStat,
  OverviewUserSummary as UserSummary,
} from '@novelia/auth-api';
import { NAlert, NButton, NSpin, NTag, NText } from 'naive-ui';
import { onMounted, ref } from 'vue';

import OverviewMetrics from './OverviewMetrics.vue';
import OverviewSystemStatus from './OverviewSystemStatus.vue';
import OverviewTrend from './OverviewTrend.vue';
import OverviewUserSummary from './OverviewUserSummary.vue';

const DAYS = 7;
const TIME_ZONE = 'Asia/Shanghai';

const { api } = useAdminKit();
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
    activityError.value =
      error instanceof Error ? error.message : String(error);
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
    userSummaryError.value =
      error instanceof Error ? error.message : String(error);
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
    settingsError.value =
      error instanceof Error ? error.message : String(error);
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
    <section class="intro" aria-labelledby="overview-title">
      <div>
        <n-text id="overview-title" tag="h1" class="intro-title">
          登录与注册统计
        </n-text>
        <n-text depth="3">展示最近 7 天的认证活动和当前系统状态。</n-text>
      </div>
      <n-tag :bordered="false" round>
        {{ dateRange.startDate }} 至 {{ dateRange.endDate }}
      </n-tag>
    </section>

    <n-alert v-if="activityError" type="error" title="认证活动加载失败">
      <div class="error-content">
        <n-text>{{ activityError }}</n-text>
        <n-button size="small" @click="loadActivity">重新加载</n-button>
      </div>
    </n-alert>

    <n-spin v-else :show="activityLoading">
      <div class="overview-grid">
        <OverviewMetrics
          class="metrics-panel"
          :summary="activitySummary"
          :previous-summary="previousActivitySummary"
        />
        <OverviewTrend class="trend-panel" :activity="authActivity" />
      </div>
    </n-spin>

    <div class="snapshot-grid">
      <n-alert v-if="userSummaryError" type="error" title="用户概况加载失败">
        <div class="error-content">
          <n-text>{{ userSummaryError }}</n-text>
          <n-button size="small" @click="loadUserSummary">重新加载</n-button>
        </div>
      </n-alert>
      <n-spin v-else :show="userSummaryLoading" class="snapshot-content">
        <OverviewUserSummary v-if="userSummary" :summary="userSummary" />
      </n-spin>

      <n-alert v-if="settingsError" type="error" title="系统状态加载失败">
        <div class="error-content">
          <n-text>{{ settingsError }}</n-text>
          <n-button size="small" @click="loadSettings">重新加载</n-button>
        </div>
      </n-alert>
      <n-spin v-else :show="settingsLoading" class="snapshot-content">
        <OverviewSystemStatus v-if="settings" :settings="settings" />
      </n-spin>
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
