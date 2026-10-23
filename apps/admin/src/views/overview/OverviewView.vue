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
      <template #loading>
        <div role="status">
          <span class="sr-only">正在加载概览…</span>
          <div class="overview-grid" aria-hidden="true">
            <div
              class="trend-panel rounded-[3px] border border-divider bg-surface px-5 pt-[18px] pb-5"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex flex-col gap-2.5">
                  <div class="skeleton h-4 w-24" />
                  <div class="skeleton h-3 w-36" />
                </div>
                <div class="flex flex-none items-center gap-4 pt-1">
                  <div class="skeleton h-2.5 w-10" />
                  <div class="skeleton h-2.5 w-10" />
                </div>
              </div>
              <div
                class="skeleton mt-6 h-[180px] w-full [@media(max-width:599px)]:h-[150px]"
              />
            </div>
            <div
              class="metrics-panel grid grid-rows-2 gap-4 [@media(max-width:767px)]:grid-cols-2 [@media(max-width:767px)]:grid-rows-none"
            >
              <div
                v-for="index in 2"
                :key="index"
                class="flex items-center justify-between gap-4 rounded-[3px] border border-divider bg-surface p-5"
              >
                <div class="flex flex-col">
                  <div class="skeleton h-3 w-16" />
                  <div class="skeleton mt-3 h-7 w-24" />
                  <div class="skeleton mt-3 h-3 w-20" />
                </div>
                <div class="skeleton size-[42px] flex-none rounded-[11px]" />
              </div>
            </div>
          </div>
        </div>
      </template>
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
          <template #loading>
            <div
              role="status"
              class="rounded-[3px] border border-divider bg-surface"
            >
              <span class="sr-only">正在加载用户概况…</span>
              <div class="px-6 pt-[19px] pb-5" aria-hidden="true">
                <div class="skeleton h-4 w-20" />
              </div>
              <div
                class="grid grid-cols-3 px-6 pt-2 pb-2 [@media(max-width:599px)]:grid-cols-1"
                aria-hidden="true"
              >
                <div
                  v-for="index in 3"
                  :key="index"
                  class="flex min-w-0 items-center gap-3.5 px-5 py-3 [@media(max-width:599px)]:px-0"
                >
                  <div class="skeleton size-[38px] flex-none rounded-[10px]" />
                  <div class="flex min-w-0 flex-col gap-2">
                    <div class="skeleton h-3 w-14" />
                    <div class="skeleton h-5 w-20" />
                  </div>
                </div>
              </div>
            </div>
          </template>
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
          <template #loading>
            <div
              role="status"
              class="rounded-[3px] border border-divider bg-surface"
            >
              <span class="sr-only">正在加载系统状态…</span>
              <div
                class="flex items-center justify-between gap-4 px-6 pt-[19px] pb-3"
                aria-hidden="true"
              >
                <div class="skeleton h-5 w-20" />
                <div class="skeleton h-6 w-16" />
              </div>
              <div
                class="grid grid-cols-2 px-6 pt-2 pb-2 [@media(max-width:599px)]:grid-cols-1"
                aria-hidden="true"
              >
                <div
                  v-for="index in 2"
                  :key="index"
                  class="flex min-w-0 items-center justify-between gap-4 px-5 py-3 [@media(max-width:599px)]:px-0"
                >
                  <div class="flex min-w-0 flex-col gap-1.5">
                    <div class="skeleton h-4 w-16" />
                    <div class="skeleton h-3 w-40" />
                  </div>
                  <div class="skeleton h-6 w-14 rounded-full" />
                </div>
              </div>
              <div class="px-6 pt-3 pb-5" aria-hidden="true">
                <div class="skeleton h-3 w-32" />
              </div>
            </div>
          </template>
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
