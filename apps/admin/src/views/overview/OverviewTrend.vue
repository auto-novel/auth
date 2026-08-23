<script setup lang="ts">
import { NCard } from 'naive-ui';
import { computed } from 'vue';

import type { DailyAuthStat } from '@/data/overview';

const props = defineProps<{ activity: DailyAuthStat[] }>();

const SERIES = [
  { field: 'loginCount', label: '登录', className: 'login' },
  { field: 'registerCount', label: '注册', className: 'register' },
] as const;

function formatDay(date: string) {
  const [, month, day] = date.split('-').map(Number);
  return `${month}/${day}`;
}

function niceMaximum(value: number) {
  if (value <= 1) return 2;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const rounded = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return rounded * magnitude;
}

const maxCount = computed(() =>
  niceMaximum(
    Math.max(
      0,
      ...props.activity.flatMap((item) =>
        SERIES.map(({ field }) => item[field]),
      ),
    ),
  ),
);

const pointPositions = computed(() => {
  const lastIndex = props.activity.length - 1;
  return props.activity.map((item, index) => {
    const x = lastIndex > 0 ? (index / lastIndex) * 100 : 50;
    return { x, item };
  });
});

const chartSeries = computed(() =>
  SERIES.map((series) => {
    const points = pointPositions.value.map(({ x, item }) => ({
      x,
      y: 96 - (item[series.field] / maxCount.value) * 92,
      item,
    }));
    return {
      ...series,
      points,
      polyline: points.map(({ x, y }) => `${x},${y}`).join(' '),
    };
  }),
);
const yAxisLabels = computed(() => [maxCount.value, maxCount.value / 2, 0]);

function formatCount(value: number) {
  return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);
}
</script>

<template>
  <n-card class="chart-card" title="每周趋势">
    <template #header-extra>
      <div class="legend" aria-label="图例">
        <span v-for="series in SERIES" :key="series.field">
          <i :class="`${series.className}-dot`" />
          {{ series.label }}
        </span>
      </div>
    </template>

    <div class="chart-layout">
      <div class="axis-labels" aria-hidden="true">
        <span v-for="(label, index) in yAxisLabels" :key="index">
          {{ formatCount(label) }}
        </span>
      </div>
      <div class="plot-column">
        <div class="plot-area">
          <i
            v-for="position in [4, 50, 96]"
            :key="position"
            class="grid-line"
            :style="{ top: `${position}%` }"
          />
          <svg
            class="trend-chart"
            viewBox="0 0 100 100"
            role="img"
            aria-label="最近七天登录和注册次数趋势"
            preserveAspectRatio="none"
          >
            <polyline
              v-for="series in chartSeries"
              :key="series.field"
              :points="series.polyline"
              :class="['chart-line', `${series.className}-line`]"
            />
          </svg>
          <template v-for="series in chartSeries" :key="series.field">
            <span
              v-for="point in series.points"
              :key="`${series.field}-${point.item.date}`"
              :class="['chart-dot', `${series.className}-dot-fill`]"
              :style="{ left: `${point.x}%`, top: `${point.y}%` }"
              :title="`${point.item.date} ${series.label}：${point.item[series.field]} 次`"
            />
          </template>
        </div>
        <div class="day-labels" aria-hidden="true">
          <span
            v-for="point in pointPositions"
            :key="point.item.date"
            :style="{ left: `${point.x}%` }"
          >
            {{ formatDay(point.item.date) }}
          </span>
        </div>
      </div>
    </div>
  </n-card>
</template>

<style scoped>
.chart-card {
  --chart-height: 180px;
  min-width: 0;
}
.chart-card :deep(.n-card-header) {
  padding: 18px 20px 12px;
}
.chart-card :deep(.n-card__content) {
  padding: 18px 20px 20px;
}
.legend {
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--n-text-color-3);
  font-size: 12px;
}
.legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.legend i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.login-dot {
  background: var(--login);
}
.register-dot {
  background: var(--register);
}
.chart-layout {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 8px;
}
.axis-labels {
  height: var(--chart-height);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: var(--n-text-color-3);
  font-size: 11px;
  line-height: 1;
  text-align: right;
  font-variant-numeric: tabular-nums;
  transform: translateY(4px);
}
.plot-column {
  min-width: 0;
}
.plot-area {
  position: relative;
  height: var(--chart-height);
}
.trend-chart {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.grid-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  border-top: 1px dashed var(--n-border-color);
  transform: translateY(-0.5px);
}
.chart-line {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
.login-line {
  stroke: var(--login);
}
.register-line {
  stroke: var(--register);
}
.chart-dot {
  position: absolute;
  z-index: 1;
  width: 9px;
  height: 9px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 50%;
  background: var(--n-color);
  transform: translate(-50%, -50%);
}
.login-dot-fill {
  border-color: var(--login);
}
.register-dot-fill {
  border-color: var(--register);
}
.day-labels {
  position: relative;
  min-height: 24px;
  margin-top: 10px;
  color: var(--n-text-color-3);
  font-size: 11px;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.day-labels span {
  position: absolute;
  top: 0;
  white-space: nowrap;
  transform: translateX(-50%);
}
.day-labels span:first-child {
  transform: none;
}
.day-labels span:last-child {
  transform: translateX(-100%);
}

@media (max-width: 599px) {
  .chart-card {
    --chart-height: 150px;
  }
  .chart-card :deep(.n-card-header),
  .chart-card :deep(.n-card__content) {
    padding-inline: 16px;
  }
  .chart-layout {
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 6px;
  }
  .day-labels span:nth-child(even) {
    visibility: hidden;
  }
}
</style>
