<script setup lang="ts">
import { XButton, useWebKit } from '@novelia/web-kit';
import { onMounted, onUnmounted, ref, watch } from 'vue';

const { theme } = useWebKit();
const values = ref<Record<string, string>>({});
const readerPreview = ref(false);
const readerBackground = ref('#fff2e2');
const readerFont = ref('#000000');
watch([readerPreview, readerBackground], ([enabled, background]) => {
  if (!enabled) {
    theme.clearOverride();
    return;
  }
  const rgb = [1, 3, 5].map((offset) =>
    parseInt(background.slice(offset, offset + 2), 16),
  );
  const brightness = (rgb[0]! * 299 + rgb[1]! * 587 + rgb[2]! * 114) / 1000;
  theme.setOverride({
    preference: brightness < 120 ? 'dark' : 'light',
    tokens: { '--color-body': background },
  });
});
onUnmounted(() => {
  if (readerPreview.value) theme.clearOverride();
});

const preferenceOptions = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
] as const;

// 使用完整的静态类名，让 Tailwind 能扫描到每个色块的工具类。
const colorGroups = [
  {
    title: '背景与文字',
    colors: [
      { token: 'paper', class: 'bg-paper' },
      { token: 'surface', class: 'bg-surface' },
      { token: 'body', class: 'bg-body' },
      { token: 'popover', class: 'bg-popover' },
      { token: 'modal', class: 'bg-modal' },
      { token: 'ink', class: 'bg-ink' },
      { token: 'muted', class: 'bg-muted' },
      { token: 'border', class: 'bg-border' },
      { token: 'divider', class: 'bg-divider' },
      { token: 'hover', class: 'bg-hover' },
    ],
  },
  {
    title: '主色',
    colors: [
      { token: 'primary', class: 'bg-primary' },
      { token: 'primary-hover', class: 'bg-primary-hover' },
      { token: 'primary-pressed', class: 'bg-primary-pressed' },
      { token: 'primary-soft', class: 'bg-primary-soft' },
      { token: 'primary-soft-hover', class: 'bg-primary-soft-hover' },
      { token: 'primary-soft-pressed', class: 'bg-primary-soft-pressed' },
      { token: 'primary-text', class: 'bg-primary-text' },
      { token: 'on-primary', class: 'bg-on-primary' },
    ],
  },
  {
    title: '成功',
    colors: [
      { token: 'success', class: 'bg-success' },
      { token: 'success-hover', class: 'bg-success-hover' },
      { token: 'success-pressed', class: 'bg-success-pressed' },
      { token: 'success-soft', class: 'bg-success-soft' },
      { token: 'success-soft-hover', class: 'bg-success-soft-hover' },
      { token: 'success-soft-pressed', class: 'bg-success-soft-pressed' },
      { token: 'success-text', class: 'bg-success-text' },
      { token: 'on-success', class: 'bg-on-success' },
    ],
  },
  {
    title: '信息',
    colors: [
      { token: 'info', class: 'bg-info' },
      { token: 'info-hover', class: 'bg-info-hover' },
      { token: 'info-pressed', class: 'bg-info-pressed' },
      { token: 'info-soft', class: 'bg-info-soft' },
      { token: 'info-soft-hover', class: 'bg-info-soft-hover' },
      { token: 'info-soft-pressed', class: 'bg-info-soft-pressed' },
      { token: 'info-text', class: 'bg-info-text' },
      { token: 'on-info', class: 'bg-on-info' },
    ],
  },
  {
    title: '警告',
    colors: [
      { token: 'warning', class: 'bg-warning' },
      { token: 'warning-hover', class: 'bg-warning-hover' },
      { token: 'warning-pressed', class: 'bg-warning-pressed' },
      { token: 'warning-soft', class: 'bg-warning-soft' },
      { token: 'warning-soft-hover', class: 'bg-warning-soft-hover' },
      { token: 'warning-soft-pressed', class: 'bg-warning-soft-pressed' },
      { token: 'warning-text', class: 'bg-warning-text' },
      { token: 'on-warning', class: 'bg-on-warning' },
    ],
  },
  {
    title: '错误',
    colors: [
      { token: 'error', class: 'bg-error' },
      { token: 'error-hover', class: 'bg-error-hover' },
      { token: 'error-pressed', class: 'bg-error-pressed' },
      { token: 'error-soft', class: 'bg-error-soft' },
      { token: 'error-soft-hover', class: 'bg-error-soft-hover' },
      { token: 'error-soft-pressed', class: 'bg-error-soft-pressed' },
      { token: 'error-text', class: 'bg-error-text' },
      { token: 'on-error', class: 'bg-on-error' },
    ],
  },
  {
    title: '中性',
    colors: [
      { token: 'neutral', class: 'bg-neutral' },
      { token: 'neutral-hover', class: 'bg-neutral-hover' },
      { token: 'neutral-pressed', class: 'bg-neutral-pressed' },
      { token: 'neutral-soft', class: 'bg-neutral-soft' },
      { token: 'neutral-soft-hover', class: 'bg-neutral-soft-hover' },
      { token: 'neutral-soft-pressed', class: 'bg-neutral-soft-pressed' },
      { token: 'neutral-text', class: 'bg-neutral-text' },
      { token: 'on-neutral', class: 'bg-on-neutral' },
    ],
  },
];

const statuses = [
  {
    label: '成功',
    class: 'bg-success-soft text-success-text',
    token: 'success',
  },
  { label: '信息', class: 'bg-info-soft text-info-text', token: 'info' },
  {
    label: '警告',
    class: 'bg-warning-soft text-warning-text',
    token: 'warning',
  },
  { label: '错误', class: 'bg-error-soft text-error-text', token: 'error' },
];
const surfaces = [
  { label: 'paper', class: 'bg-paper' },
  { label: 'surface', class: 'bg-surface' },
  { label: 'body', class: 'bg-body' },
  { label: 'popover', class: 'bg-popover' },
  { label: 'modal', class: 'bg-modal' },
];
function readThemeValues() {
  const style = getComputedStyle(document.documentElement);
  values.value = Object.fromEntries(
    colorGroups.flatMap((group) =>
      group.colors.map(({ token }) => [
        token,
        style.getPropertyValue(`--color-${token}`).trim(),
      ]),
    ),
  );
}

onMounted(readThemeValues);
watch([theme.theme, theme.override], readThemeValues, { flush: 'post' });
</script>

<template>
  <div class="page-container flex flex-col gap-8 py-6">
    <header
      class="flex flex-wrap items-start justify-between gap-4 border-b border-divider pb-6"
    >
      <div>
        <h1 class="mb-2 text-lg font-medium">主题测试</h1>
        <p class="text-sm text-muted">
          使用 web-kit 的真实主题变量和 Tailwind 工具类，不另设展示配色。
        </p>
        <p class="mt-1 text-xs text-muted">
          切换主题后，色块和变量值会同步更新。“跟随系统”会响应操作系统的
          prefers-color-scheme 变化，切换按钮则按当前外观取反并固定下来。
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div
          class="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="主题偏好"
        >
          <XButton
            v-for="option in preferenceOptions"
            :key="option.value"
            :color="
              theme.preference.value === option.value ? 'primary' : 'neutral'
            "
            :variant="
              theme.preference.value === option.value ? 'solid' : 'outline'
            "
            @click="theme.setPreference(option.value)"
          >
            {{ option.label }}
          </XButton>
        </div>
        <XButton color="neutral" variant="outline" @click="theme.toggleTheme">
          当前：{{ theme.isDark.value ? '深色' : '浅色' }} · 切换主题
        </XButton>
      </div>
    </header>

    <section aria-labelledby="reader-theme-preview">
      <h2 id="reader-theme-preview" class="mb-2 font-medium">阅读器临时主题</h2>
      <p class="mb-4 text-sm text-muted">
        按背景亮度选择 UI
        明暗基底，正文色单独设置。站点偏好不变，关闭预览或离开本页后恢复。
      </p>
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <label class="flex items-center gap-2">
          <input v-model="readerPreview" type="checkbox" />
          启用临时覆盖
        </label>
        <label class="flex items-center gap-2">
          背景
          <input v-model="readerBackground" type="color" />
        </label>
        <label class="flex items-center gap-2">
          正文
          <input v-model="readerFont" type="color" />
        </label>
        <span class="text-sm text-muted">
          站点偏好：{{ theme.preference.value }} · 生效外观：{{
            theme.theme.value
          }}
        </span>
      </div>
      <div
        class="rounded-md border border-border bg-body p-6"
        :style="{ color: readerPreview ? readerFont : undefined }"
      >
        这是阅读正文。修改背景时，页面背景和明暗基底同步更新；正文色不会影响菜单和按钮。
      </div>
    </section>

    <section aria-labelledby="theme-palette">
      <h2 id="theme-palette" class="mb-2 font-medium">颜色 token</h2>
      <p class="mb-4 text-sm text-muted">
        色块使用 bg-*，下方显示根元素上的实际变量值。半透明色叠加在 surface
        背景上。每种语义色提供相同的状态、浅底、文字及反色角色。语义浅底默认浅色为
        10%、深色为 15%，中性浅底为 5% / 8%；交互状态逐级增强。
      </p>
      <div
        v-for="group in colorGroups"
        :key="group.title"
        class="mb-6 last:mb-0"
      >
        <h3 class="mb-3 text-sm font-medium">{{ group.title }}</h3>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div
            v-for="color in group.colors"
            :key="color.token"
            class="overflow-hidden rounded-sm border border-border bg-surface"
          >
            <div
              class="h-16 border-b border-divider"
              :class="color.class"
              aria-hidden="true"
            />
            <div class="p-3">
              <code class="block break-all text-xs text-ink">
                --color-{{ color.token }}
              </code>
              <code class="mt-1 block break-all text-xs text-muted">
                {{ values[color.token] || '—' }}
              </code>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="theme-surfaces"
      class="border-t border-divider pt-6"
    >
      <h2 id="theme-surfaces" class="mb-4 font-medium">背景层级与文字</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="surface in surfaces"
          :key="surface.label"
          class="rounded-sm border border-border p-4"
          :class="surface.class"
        >
          <h3 class="mb-3 font-medium text-ink">bg-{{ surface.label }}</h3>
          <p class="text-sm text-ink">正文 / text-ink：中文 Aa 0123456789</p>
          <p class="mt-2 text-sm text-muted">次要文字 / text-muted：辅助说明</p>
          <p class="mt-2 text-xs text-muted">
            小号文字：用于检查低对比度背景的可读性
          </p>
          <div class="my-3 border-t border-divider" />
          <a
            href="#/theme"
            class="text-sm text-primary underline decoration-primary/40 underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-primary"
          >
            主题链接 / text-primary
          </a>
          <div class="mt-3 rounded-sm bg-hover p-2 text-xs text-ink">
            悬停底色 / bg-hover
          </div>
        </article>
      </div>
    </section>

    <section
      aria-labelledby="theme-status"
      class="border-t border-divider pt-6"
    >
      <h2 id="theme-status" class="mb-4 font-medium">语义状态与浅色背景</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <article
          v-for="status in statuses"
          :key="status.token"
          class="rounded-sm p-4"
          :class="status.class"
        >
          <h3 class="mb-1 text-sm font-medium">
            {{ status.label }} · {{ status.token }}
          </h3>
          <p class="text-sm">这是一条状态说明，检查文字与 soft 背景的搭配。</p>
          <p class="mt-2 break-all font-mono text-xs">{{ status.class }}</p>
        </article>
      </div>
      <div
        class="mt-4 rounded-sm border border-error/30 bg-surface p-4 text-sm text-error-text"
        style="
          background-image: linear-gradient(
            var(--color-error-soft),
            var(--color-error-soft)
          );
        "
      >
        错误提示：error/30 边框 + error-soft 叠加背景 + error-text 文字。
      </div>
    </section>

    <section
      aria-labelledby="theme-accent"
      class="border-t border-divider pt-6"
    >
      <h2 id="theme-accent" class="mb-4 font-medium">主色与危险色对比</h2>
      <div class="mt-4 flex flex-wrap gap-3">
        <div class="rounded-sm bg-primary px-4 py-3 text-sm text-on-primary">
          bg-primary + text-on-primary
        </div>
        <div
          class="rounded-sm bg-primary-hover px-4 py-3 text-sm text-on-primary"
        >
          bg-primary-hover + text-on-primary
        </div>
        <div class="rounded-sm bg-error px-4 py-3 text-sm text-on-error">
          bg-error + text-on-error
        </div>
        <div class="rounded-sm bg-error-hover px-4 py-3 text-sm text-on-error">
          bg-error-hover + text-on-error
        </div>
      </div>
    </section>
  </div>
</template>
