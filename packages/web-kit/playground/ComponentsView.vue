<script setup lang="ts">
import {
  Toast,
  XButton,
  XTime,
  XTooltip,
  type XButtonColor,
  type XButtonVariant,
} from '@novelia/web-kit';
import { RouterLink } from 'vue-router';

import { componentPages } from './componentPages';

const sampleTime = new Date('2025-06-05T15:04:30+08:00');
const relativeBase = new Date('2025-06-05T15:07:30+08:00');
const colors: XButtonColor[] = ['primary', 'neutral', 'danger', 'warning'];
const variants: XButtonVariant[] = ['solid', 'soft', 'outline', 'ghost'];
</script>

<template>
  <div class="page-container flex flex-col gap-8 py-6">
    <header class="border-b border-divider pb-6">
      <h1 class="mb-2 text-lg font-medium">组件总览</h1>
      <p class="text-sm text-muted">
        基础组件在此快速预览；复杂组件进入独立页面查看介绍、交互示例和用法。
      </p>
    </header>

    <section aria-labelledby="component-pages">
      <h2 id="component-pages" class="mb-3 font-medium">组件详细介绍</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <RouterLink
          v-for="item in componentPages"
          :key="item.to"
          :to="item.to"
          class="rounded-sm border border-border bg-surface p-4 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          <h3 class="mb-2 font-medium">{{ item.title }} →</h3>
          <p class="text-sm leading-6 text-muted">{{ item.description }}</p>
        </RouterLink>
      </div>
    </section>

    <section aria-labelledby="test-buttons">
      <h2 id="test-buttons" class="mb-2 font-medium">按钮 · XButton</h2>
      <p class="mb-4 text-sm text-muted">
        悬停查看 hover 色，使用 Tab 检查 focus-visible；每种语义色展示
        solid、soft、outline、ghost，以及紧凑、禁用和加载状态，加载时保留文字并禁止点击。
      </p>
      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="color in colors"
          :key="color"
          class="flex flex-wrap items-center gap-3 rounded-sm border border-border p-3"
        >
          <code class="w-24 text-xs text-muted">{{ color }}</code>
          <XButton
            v-for="variant in variants"
            :key="variant"
            :color="color"
            :variant="variant"
            @click="Toast.success(`点击了 ${color} ${variant} 按钮`)"
          >
            {{ variant }}
          </XButton>
          <XButton :color="color" variant="soft" size="tiny">紧凑按钮</XButton>
          <XButton :color="color" disabled>禁用</XButton>
          <XButton :color="color" loading>加载中</XButton>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="test-tooltip"
      class="border-t border-divider pt-6"
    >
      <h2 id="test-tooltip" class="mb-2 font-medium">提示 · XTooltip</h2>
      <p class="mb-4 text-sm text-muted">
        悬停或通过键盘聚焦按钮，查看提示浮层。
      </p>
      <XTooltip>
        <template #trigger>
          <XButton color="neutral" variant="outline">查看提示</XButton>
        </template>
        提示浮层与菜单使用相同的圆角和阴影。
      </XTooltip>
    </section>

    <section aria-labelledby="test-time" class="border-t border-divider pt-6">
      <h2 id="test-time" class="mb-2 font-medium">时间 · XTime</h2>
      <p class="mb-4 text-sm text-muted">
        检查预设格式、自定义格式及非法值处理。
      </p>
      <dl class="grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
        <dt class="text-muted">默认预设</dt>
        <dd><XTime :time="sampleTime" /></dd>
        <dt class="text-muted">date 预设</dt>
        <dd><XTime :time="sampleTime" preset="date" /></dd>
        <dt class="text-muted">datetime-numeric</dt>
        <dd><XTime :time="sampleTime" preset="datetime-numeric" /></dd>
        <dt class="text-muted">自定义格式</dt>
        <dd><XTime :time="sampleTime" format="yyyy/M/d HH:mm:ss" /></dd>
        <dt class="text-muted">相对时间</dt>
        <dd>
          <XTime :time="sampleTime" preset="relative" :to="relativeBase" />
        </dd>
        <dt class="text-muted">非法值</dt>
        <dd>
          <XTime time="not-a-date" />
          （不渲染）
        </dd>
      </dl>
    </section>
  </div>
</template>
