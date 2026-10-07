<script setup lang="ts">
import {
  Notify,
  XActionMenu,
  XActionMenuItem,
  XButton,
  XConfirmDialog,
  XSelect,
  XTime,
  XTooltip,
  useWebKit,
  useWebKitLayout,
} from '@novelia/web-kit';
import { ref } from 'vue';

const { whoami } = useWebKit();
const { scrollToTop } = useWebKitLayout();

const selected = ref('alpha');
const confirmOpen = ref(false);
const options = [
  { label: '选项 A', value: 'alpha' },
  { label: '选项 B', value: 'beta' },
  { label: '选项 C', value: 'gamma' },
];

const sampleTime = new Date('2025-06-05T15:04:30+08:00');
const relativeBase = new Date('2025-06-05T15:07:30+08:00');
</script>

<template>
  <div class="page-container flex flex-col gap-6 py-6">
    <section class="border-divider border-b pb-6">
      <h1 class="mb-2 text-lg font-medium">web-kit playground</h1>
      <p class="text-muted text-sm">
        这里以源码方式引入
        <code>@novelia/web-kit</code>
        ，改
        <code>packages/web-kit/src</code>
        下的组件或 CSS 会立即热更新，不需要先 build，也不需要宿主应用。
      </p>
    </section>

    <section class="border-divider border-b pb-6">
      <h2 class="mb-3 font-medium">会话</h2>
      <p class="text-sm">
        登录状态：{{
          whoami.isSignedIn ? (whoami.user?.username ?? '已登录') : '未登录'
        }}
      </p>
      <p class="text-muted mt-1 text-xs">
        auth.url 指向相对地址
        <code>/auth</code>
        ，playground 里不会有真实会话，用来验证未登录态的表现。
      </p>
    </section>

    <section
      class="border-divider flex flex-wrap items-center gap-3 border-b pb-6"
    >
      <h2 class="w-full font-medium">浮层与通知</h2>
      <p class="text-muted w-full text-sm">
        打开下拉菜单和确认框，或悬停提示按钮，查看浮层样式。侧栏的“切换主题”可对比浅色与暗色效果。
      </p>
      <XButton @click="Notify.success('操作成功')">成功通知</XButton>
      <XButton variant="danger" @click="Notify.error('操作失败')">
        失败通知
      </XButton>
      <XButton variant="ghost" @click="Notify.dismissAll()">清空通知</XButton>
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
      <XButton variant="ghost" @click="scrollToTop({ behavior: 'smooth' })">
        滚回顶部
      </XButton>
      <div class="w-48">
        <XSelect v-model="selected" :options="options" aria-label="示例选项" />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm">操作菜单</span>
        <XActionMenu align="start">
          <XActionMenuItem @activate="Notify.success('已选择编辑')">
            编辑
          </XActionMenuItem>
          <XActionMenuItem disabled>暂不可用</XActionMenuItem>
          <XActionMenuItem danger @activate="confirmOpen = true">
            删除示例
          </XActionMenuItem>
        </XActionMenu>
      </div>
      <XButton variant="outline" @click="confirmOpen = true">
        打开确认框
      </XButton>
      <XTooltip>
        <template #trigger>
          <XButton variant="outline">悬停查看提示</XButton>
        </template>
        提示浮层与菜单使用相同的圆角和阴影。
      </XTooltip>
      <XConfirmDialog
        v-model:open="confirmOpen"
        title="删除示例"
        description="这是确认框的展示示例，确认后会显示成功通知，不会删除实际数据。"
        confirm-label="确认删除"
        danger
        @confirm="Notify.success('示例操作完成')"
      />
    </section>

    <section class="border-divider border-b pb-6">
      <h2 class="mb-3 font-medium">时间</h2>
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

    <section class="border-divider border-b pb-6">
      <h2 class="mb-3 font-medium">长内容（验证布局内滚动）</h2>
      <p v-for="index in 40" :key="index" class="text-muted py-1 text-sm">
        第 {{ index }} 行
      </p>
    </section>
  </div>
</template>
