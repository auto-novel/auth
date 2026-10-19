<script setup lang="ts">
import { XScrollArea } from '@novelia/web-kit';
import { ref } from 'vue';

import ComponentPage from './ComponentPage.vue';

const scrollType = ref<'auto' | 'always' | 'scroll' | 'hover'>('auto');
const code = `<XScrollArea class="h-48 w-full max-w-lg" :ui="{ viewport: 'p-4' }">
  <p v-for="row in 20" :key="row">第 {{ row }} 行</p>
</XScrollArea>

<XScrollArea orientation="horizontal" class="h-32 w-full max-w-lg">
  <div class="w-160 p-4">固定宽度的横向内容</div>
</XScrollArea>

<XScrollArea
  orientation="both"
  type="hover"
  :scroll-hide-delay="600"
  class="h-48 w-full max-w-lg"
>
  <div class="w-160 p-4">
    <p v-for="row in 20" :key="row">第 {{ row }} 行：双向滚动内容</p>
  </div>
</XScrollArea>`;
</script>

<template>
  <ComponentPage
    title="滚动区域 · XScrollArea"
    description="在受限尺寸内滚动内容，支持纵向、横向、双向滚动与不同的滚动条显示模式。"
    :code="code"
  >
    <section aria-labelledby="scroll-directions" class="min-w-0">
      <h2 id="scroll-directions" class="mb-2 font-medium">三个滚动方向</h2>
      <p id="scroll-keyboard-help" class="mb-4 text-sm leading-6 text-muted">
        使用滚轮、触控板或拖动滚动条浏览内容。按 Tab
        聚焦滚动视口后，可用方向键滚动；横向区域可用左右方向键。
        外层必须有明确的高度和受限宽度，内容溢出后才会产生滚动。
      </p>
      <div class="grid min-w-0 gap-6 lg:grid-cols-2">
        <div class="min-w-0">
          <h3 class="mb-2 text-sm text-muted">纵向 · vertical（默认）</h3>
          <XScrollArea
            class="h-48 w-full max-w-lg rounded-sm border border-border bg-surface"
            :ui="{ viewport: 'p-4' }"
          >
            <ul class="space-y-3 text-sm">
              <li v-for="index in 16" :key="index">
                第 {{ index }} 项 · 项目动态
              </li>
            </ul>
          </XScrollArea>
        </div>
        <div class="min-w-0">
          <h3 class="mb-2 text-sm text-muted">横向 · horizontal</h3>
          <XScrollArea
            orientation="horizontal"
            class="h-32 w-full max-w-lg rounded-sm border border-border bg-surface"
          >
            <div class="flex w-max gap-3 p-4">
              <div
                v-for="index in 8"
                :key="index"
                class="flex h-20 w-32 shrink-0 items-center justify-center rounded-sm border border-border bg-hover text-sm"
              >
                卡片 {{ index }}
              </div>
            </div>
          </XScrollArea>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="scroll-modes"
      class="min-w-0 border-t border-divider pt-6"
    >
      <h2 id="scroll-modes" class="mb-3 font-medium">双向滚动与 type 模式</h2>
      <div class="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <label for="scroll-area-type">滚动条显示模式</label>
        <select
          id="scroll-area-type"
          v-model="scrollType"
          class="rounded-sm border border-border bg-surface px-3 py-2 text-ink focus-visible:outline-2 focus-visible:outline-primary"
        >
          <option value="auto">auto · 溢出时显示</option>
          <option value="always">always · 始终显示</option>
          <option value="scroll">scroll · 滚动时显示</option>
          <option value="hover">hover · 悬停时显示</option>
        </select>
      </div>
      <XScrollArea
        :key="scrollType"
        orientation="both"
        :type="scrollType"
        :scroll-hide-delay="600"
        class="h-48 w-full max-w-lg rounded-sm border border-border bg-surface"
      >
        <div class="w-160 space-y-3 p-4 text-sm">
          <p v-for="index in 16" :key="index">
            第 {{ index }} 行 ·
            这段内容同时超出视口的宽度和高度，可沿两个方向查看。
          </p>
        </div>
      </XScrollArea>
      <p class="mt-3 text-sm leading-6 text-muted">
        切换模式会重建此示例并重置滚动位置。scroll / hover
        模式在停止滚动或移出后延迟隐藏；这里的延迟为 600 毫秒。
      </p>
    </section>

    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">API 与布局</h2>
      <dl class="space-y-3 text-sm leading-6">
        <div>
          <dt class="font-medium">orientation</dt>
          <dd class="text-muted">
            vertical（默认）、horizontal 或 both，控制启用的滚动方向。
          </dd>
        </div>
        <div>
          <dt class="font-medium">type</dt>
          <dd class="text-muted">
            auto（默认）在内容溢出时显示；always 始终显示；scroll
            在滚动时显示；hover 在鼠标悬停时显示。显示模式不改变内容尺寸。
          </dd>
        </div>
        <div>
          <dt class="font-medium">scrollHideDelay</dt>
          <dd class="text-muted">
            隐藏滚动条前的延迟，单位毫秒，默认 600；用于 scroll / hover 模式。
          </dd>
        </div>
        <div>
          <dt class="font-medium">ui.viewport / 默认插槽</dt>
          <dd class="text-muted">
            ui.viewport 为内部视口覆盖样式；内容放入默认插槽。通过外层 class
            限定尺寸，横向示例的内容需宽于视口；在 grid / flex 布局中保留
            min-w-0，避免撑开页面。
          </dd>
        </div>
      </dl>
    </section>
  </ComponentPage>
</template>
