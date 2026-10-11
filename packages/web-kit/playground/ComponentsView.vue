<script setup lang="ts">
import {
  Notify,
  XActionMenu,
  XActionMenuItem,
  XButton,
  XConfirmDialog,
  XPagination,
  XSelect,
  XTime,
  XTooltip,
  type XButtonVariant,
} from '@novelia/web-kit';
import { ref } from 'vue';

const confirmOpen = ref(false);
const selected = ref('alpha');
const scrollSelected = ref('option-1');
const scrollOptions = Array.from({ length: 30 }, (_, index) => ({
  label: `选项 ${index + 1}`,
  value: `option-${index + 1}`,
}));
const page = ref(2);
const options = [
  { label: '选项 A', value: 'alpha' },
  { label: '选项 B', value: 'beta' },
  { label: '选项 C', value: 'gamma' },
];
const sampleTime = new Date('2025-06-05T15:04:30+08:00');
const relativeBase = new Date('2025-06-05T15:07:30+08:00');
const menuAlignments = ['start', 'end'] as const;
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
</script>

<template>
  <div class="page-container flex flex-col gap-8 py-6">
    <header class="border-b border-divider pb-6">
      <h1 class="mb-2 text-lg font-medium">组件测试</h1>
      <p class="text-sm text-muted">
        按组件类型查看交互示例。可通过侧栏切换主题，检查浅色与深色效果。
      </p>
    </header>

    <section aria-labelledby="test-buttons">
      <h2 id="test-buttons" class="mb-2 font-medium">按钮 · XButton</h2>
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
    </section>

    <section aria-labelledby="test-select" class="border-t border-divider pt-6">
      <h2 id="test-select" class="mb-2 font-medium">选择器 · XSelect</h2>
      <p class="mb-4 text-sm text-muted">
        检查选项切换、键盘操作和禁用状态；长列表可通过滚轮、拖动滚动条或方向键浏览，切换主题检查滚动条配色。
      </p>
      <div class="flex flex-wrap gap-4">
        <label class="flex w-48 flex-col gap-2 text-sm text-muted">
          正常
          <XSelect
            v-model="selected"
            :options="options"
            aria-label="示例选项"
          />
        </label>
        <label class="flex w-48 flex-col gap-2 text-sm text-muted">
          禁用
          <XSelect
            v-model="selected"
            :options="options"
            disabled
            aria-label="禁用示例选项"
          />
        </label>
        <label class="flex w-48 flex-col gap-2 text-sm text-muted">
          长列表 · 30 项
          <XSelect
            v-model="scrollSelected"
            :options="scrollOptions"
            aria-label="滚动条示例选项"
          />
        </label>
      </div>
      <p class="mt-3 text-xs text-muted">
        当前值：{{ selected }} · 长列表当前值：{{ scrollSelected }}
      </p>
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
          <XButton variant="outline">查看提示</XButton>
        </template>
        提示浮层与菜单使用相同的圆角和阴影。
      </XTooltip>
    </section>

    <section aria-labelledby="test-menu" class="border-t border-divider pt-6">
      <h2 id="test-menu" class="mb-2 font-medium">操作菜单 · XActionMenu</h2>
      <p class="mb-4 text-sm text-muted">
        检查浮层对齐、普通项、禁用项和危险项；危险项会打开下方的确认框。
      </p>
      <div class="flex flex-wrap items-center gap-6">
        <div
          v-for="align in menuAlignments"
          :key="align"
          class="flex items-center gap-2"
        >
          <span class="text-sm text-muted">{{ align }} 对齐</span>
          <XActionMenu :align="align">
            <XActionMenuItem @activate="Notify.success('已选择编辑')">
              编辑
            </XActionMenuItem>
            <XActionMenuItem disabled>暂不可用</XActionMenuItem>
            <XActionMenuItem danger @activate="confirmOpen = true">
              删除示例
            </XActionMenuItem>
          </XActionMenu>
        </div>
      </div>
    </section>

    <section aria-labelledby="test-dialog" class="border-t border-divider pt-6">
      <h2 id="test-dialog" class="mb-2 font-medium">确认框 · XConfirmDialog</h2>
      <p class="mb-4 text-sm text-muted">
        检查打开、取消和确认流程，此示例不会删除实际数据。
      </p>
      <XButton variant="danger" @click="confirmOpen = true">打开确认框</XButton>
      <XConfirmDialog
        v-model:open="confirmOpen"
        title="删除示例"
        description="这是确认框的展示示例，确认后会显示成功通知，不会删除实际数据。"
        confirm-label="确认删除"
        danger
        @confirm="Notify.success('示例操作完成')"
      />
    </section>

    <section aria-labelledby="test-notify" class="border-t border-divider pt-6">
      <h2 id="test-notify" class="mb-2 font-medium">通知 · Notify</h2>
      <p class="mb-4 text-sm text-muted">
        检查成功、错误、多行内容及通知清理。
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <XButton @click="Notify.success('操作成功')">成功通知</XButton>
        <XButton variant="danger" @click="Notify.error('操作失败')">
          错误通知
        </XButton>
        <XButton
          variant="outline"
          @click="
            Notify.success(
              '设置已保存。\n这是一条多行通知，用于检查换行和浮层宽度。',
            )
          "
        >
          多行通知
        </XButton>
        <XButton variant="ghost" @click="Notify.dismissAll()">清空通知</XButton>
      </div>
    </section>

    <section
      aria-labelledby="test-pagination"
      class="border-t border-divider pt-6"
    >
      <h2 id="test-pagination" class="mb-2 font-medium">分页 · XPagination</h2>
      <p class="mb-4 text-sm text-muted">
        检查上一页、下一页和页码切换；桌面端点击省略号，移动端点击中间页数，可跳转到指定页，支持回车确认。
      </p>
      <XPagination :page="page" :total-pages="20" @change="page = $event" />
      <p class="mt-3 text-xs text-muted">当前页：{{ page }} / 20</p>
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
