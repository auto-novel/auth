<script setup lang="ts">
import {
  Notify,
  XActionMenu,
  XActionMenuItem,
  XButton,
  XConfirmDialog,
  XPagination,
  XSelect,
  XTooltip,
  useWebKit,
  type XButtonVariant,
} from '@novelia/web-kit';
import { onMounted, ref, watch } from 'vue';

const { theme } = useWebKit();
const confirmOpen = ref(false);
const selected = ref('primary');
const page = ref(2);
const values = ref<Record<string, string>>({});

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
    title: '主色与成功',
    colors: [
      { token: 'primary', class: 'bg-primary' },
      { token: 'primary-hover', class: 'bg-primary-hover' },
      { token: 'primary-soft', class: 'bg-primary-soft' },
      { token: 'on-primary', class: 'bg-on-primary' },
      { token: 'success', class: 'bg-success' },
      { token: 'success-soft', class: 'bg-success-soft' },
    ],
  },
  {
    title: '信息、警告与错误',
    colors: [
      { token: 'info', class: 'bg-info' },
      { token: 'info-soft', class: 'bg-info-soft' },
      { token: 'warning', class: 'bg-warning' },
      { token: 'warning-soft', class: 'bg-warning-soft' },
      { token: 'error', class: 'bg-error' },
      { token: 'error-hover', class: 'bg-error-hover' },
      { token: 'error-strong', class: 'bg-error-strong' },
      { token: 'error-soft', class: 'bg-error-soft' },
      { token: 'error-border', class: 'bg-error-border' },
      { token: 'on-error', class: 'bg-on-error' },
    ],
  },
];

const statuses = [
  { label: '成功', class: 'bg-success-soft text-success', token: 'success' },
  { label: '信息', class: 'bg-info-soft text-info', token: 'info' },
  { label: '警告', class: 'bg-warning-soft text-warning', token: 'warning' },
  { label: '错误', class: 'bg-error-soft text-error-strong', token: 'error' },
];
const variants: XButtonVariant[] = [
  'primary',
  'outline',
  'danger',
  'ghost',
  'ghost-active',
  'subtle',
  'toolbar',
  'plain',
];
const surfaces = [
  { label: 'paper', class: 'bg-paper' },
  { label: 'surface', class: 'bg-surface' },
  { label: 'body', class: 'bg-body' },
  { label: 'popover', class: 'bg-popover' },
  { label: 'modal', class: 'bg-modal' },
];
const legacyColors = [
  { label: 'blue', class: 'bg-blue-50 text-blue-600' },
  { label: 'orange', class: 'bg-orange-50 text-orange-600' },
  { label: 'purple', class: 'bg-purple-50 text-purple-600' },
  { label: 'red', class: 'bg-red-50 text-red-600' },
];
const options = [
  { label: '主色 / primary', value: 'primary' },
  { label: '成功 / success', value: 'success' },
  { label: '错误 / error', value: 'error' },
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
watch(theme.theme, readThemeValues, { flush: 'post' });
</script>

<template>
  <div class="page-container flex flex-col gap-8 py-6">
    <header
      class="flex flex-wrap items-start justify-between gap-4 border-b border-divider pb-6"
    >
      <div>
        <h1 class="mb-2 text-lg font-medium">Tailwind 主题</h1>
        <p class="text-sm text-muted">
          使用 web-kit 的真实主题变量和 Tailwind 工具类，不另设展示配色。
        </p>
        <p class="mt-1 text-xs text-muted">
          切换主题后，色块、变量值及组件会同步更新。
        </p>
      </div>
      <XButton variant="outline" @click="theme.toggleTheme">
        当前：{{ theme.isDark.value ? '深色' : '浅色' }} · 切换主题
      </XButton>
    </header>

    <section aria-labelledby="theme-palette">
      <h2 id="theme-palette" class="mb-2 font-medium">颜色 token</h2>
      <p class="mb-4 text-sm text-muted">
        色块使用 bg-*，下方显示根元素上的实际变量值。半透明色叠加在 surface
        背景上。
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
        class="mt-4 rounded-sm border border-error-border bg-surface p-4 text-sm text-error-strong"
        style="
          background-image: linear-gradient(
            var(--color-error-soft),
            var(--color-error-soft)
          );
        "
      >
        错误提示：error-border 边框 + error-soft 叠加背景 + error-strong 文字。
      </div>
      <h3 class="mb-3 mt-6 text-sm font-medium">保留的 Tailwind 色号覆盖</h3>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          v-for="color in legacyColors"
          :key="color.label"
          class="rounded-sm p-4 text-sm"
          :class="color.class"
        >
          <p class="font-medium">{{ color.label }}</p>
          <code class="mt-2 block text-xs">{{ color.class }}</code>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="theme-buttons"
      class="border-t border-divider pt-6"
    >
      <h2 id="theme-buttons" class="mb-2 font-medium">按钮与交互状态</h2>
      <p class="mb-4 text-sm text-muted">
        悬停查看 hover 色，使用 Tab 检查 focus-visible；右侧为禁用状态。
      </p>
      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="variant in variants"
          :key="variant"
          class="flex flex-wrap items-center gap-3 rounded-sm border border-border p-3"
        >
          <code class="w-24 text-xs text-muted">{{ variant }}</code>
          <XButton
            :variant="variant"
            @click="Notify.success(`点击了 ${variant} 按钮`)"
          >
            示例按钮
          </XButton>
          <XButton :variant="variant" disabled>禁用</XButton>
        </div>
      </div>
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

    <section
      aria-labelledby="theme-components"
      class="border-t border-divider pt-6"
    >
      <h2 id="theme-components" class="mb-4 font-medium">组件与浮层</h2>
      <div class="flex flex-wrap items-center gap-3">
        <div class="w-48">
          <XSelect
            v-model="selected"
            :options="options"
            aria-label="主题示例选项"
          />
        </div>
        <div class="w-48">
          <XSelect
            v-model="selected"
            :options="options"
            disabled
            aria-label="禁用主题示例选项"
          />
        </div>
        <XTooltip>
          <template #trigger>
            <XButton variant="outline">悬停查看 Tooltip</XButton>
          </template>
          popover 背景、floating 圆角与阴影
        </XTooltip>
        <XActionMenu>
          <XActionMenuItem @activate="Notify.success('普通菜单项')">
            普通菜单项
          </XActionMenuItem>
          <XActionMenuItem disabled>禁用菜单项</XActionMenuItem>
          <XActionMenuItem danger @activate="confirmOpen = true">
            危险菜单项
          </XActionMenuItem>
        </XActionMenu>
        <XButton variant="danger" @click="confirmOpen = true">
          打开确认框
        </XButton>
        <XButton
          variant="outline"
          @click="Notify.success('成功通知：检查 success 文字与浮层背景。')"
        >
          成功通知
        </XButton>
        <XButton
          variant="outline"
          @click="Notify.error('错误通知：检查 error 文字与浮层背景。')"
        >
          错误通知
        </XButton>
      </div>
      <div class="mt-6 flex flex-wrap items-start gap-4">
        <div class="floating-panel p-4">
          <h3 class="mb-1 text-sm font-medium">floating-panel</h3>
          <p class="text-xs text-muted">
            popover 背景 / radius-floating / shadow-floating
          </p>
        </div>
        <div class="rounded-floating bg-modal p-4 shadow-floating">
          <h3 class="mb-1 text-sm font-medium">modal</h3>
          <p class="text-xs text-muted">
            modal 背景 / radius-floating / shadow-floating
          </p>
        </div>
      </div>
      <div class="mt-6">
        <XPagination :page="page" :total-pages="8" @change="page = $event" />
      </div>
      <XConfirmDialog
        v-model:open="confirmOpen"
        title="主题确认框示例"
        description="检查弹窗背景、次要文字和危险按钮。此操作不会删除数据。"
        confirm-label="确认示例"
        danger
        @confirm="Notify.success('示例操作完成')"
      />
    </section>
  </div>
</template>
