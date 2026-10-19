<script setup lang="ts">
import { XSeparator } from '@novelia/web-kit';

import ComponentPage from './ComponentPage.vue';

const code = `<!-- 默认水平、装饰性分隔线 -->
<XSeparator />

<!-- 垂直分隔线继承容器高度，容器需要固定高度 -->
<div class="flex h-10 items-center gap-4">
  <span>概览</span>
  <XSeparator orientation="vertical" />
  <span>设置</span>
</div>

<!-- 为内容分组提供可访问的 separator 语义 -->
<p>账户信息</p>
<XSeparator :decorative="false" />
<p>通知偏好</p>`;
</script>

<template>
  <ComponentPage
    title="分隔线 · XSeparator"
    description="用水平或垂直分隔线划分内容，可选择纯视觉装饰或向辅助技术暴露分隔语义。"
    :code="code"
  >
    <section aria-labelledby="separator-horizontal">
      <h2 id="separator-horizontal" class="mb-2 font-medium">
        水平 · 默认装饰性
      </h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        默认占满容器宽度，高度为 1px。用于增强视觉层次，不向辅助技术提供
        separator 角色。
      </p>
      <div class="space-y-4 rounded-sm border border-border bg-surface p-4">
        <div>
          <h3 class="text-sm font-medium">项目概览</h3>
          <p class="mt-1 text-sm text-muted">查看项目的基本信息。</p>
        </div>
        <XSeparator />
        <p class="text-sm text-muted">最近更新：组件示例已准备就绪。</p>
      </div>
    </section>

    <section
      aria-labelledby="separator-vertical"
      class="border-t border-divider pt-6"
    >
      <h2 id="separator-vertical" class="mb-2 font-medium">
        垂直 · 固定高度容器
      </h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        垂直分隔线宽度为 1px，高度为父容器的 100%。下方容器固定为
        h-10，不依赖文字撑起高度。
      </p>
      <div class="rounded-sm border border-border bg-surface p-4">
        <div class="flex h-10 items-center gap-3 text-sm sm:gap-6">
          <span>概览</span>
          <XSeparator orientation="vertical" />
          <span>活动</span>
          <XSeparator orientation="vertical" />
          <span>设置</span>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="separator-semantic"
      class="border-t border-divider pt-6"
    >
      <h2 id="separator-semantic" class="mb-2 font-medium">
        语义分隔 · decorative=false
      </h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        当分隔线表达内容分组边界时，设置 :decorative="false"，向辅助技术暴露
        separator 角色及方向信息。它不会成为可操作控件，也无需加入 Tab
        顺序；视觉样式不变。
      </p>
      <div class="space-y-4 rounded-sm border border-border bg-surface p-4">
        <div>
          <h3 class="text-sm font-medium">账户信息</h3>
          <p class="mt-1 text-sm text-muted">管理姓名和联系方式。</p>
        </div>
        <XSeparator :decorative="false" />
        <div>
          <h3 class="text-sm font-medium">通知偏好</h3>
          <p class="mt-1 text-sm text-muted">选择接收哪些项目提醒。</p>
        </div>
      </div>
    </section>

    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">API</h2>
      <dl class="space-y-3 text-sm leading-6">
        <div>
          <dt class="font-medium">orientation</dt>
          <dd class="text-muted">
            horizontal（默认）或
            vertical。水平分隔线填满宽度；垂直分隔线需要父容器有明确高度。
          </dd>
        </div>
        <div>
          <dt class="font-medium">decorative</dt>
          <dd class="text-muted">
            布尔值，默认 true，仅作装饰；传入 :decorative="false" 提供 separator
            语义。使用布尔绑定，避免将字符串 "false" 误当作布尔值。
          </dd>
        </div>
      </dl>
    </section>
  </ComponentPage>
</template>
