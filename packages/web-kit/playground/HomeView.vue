<script setup lang="ts">
import {
  Notify,
  XButton,
  XSelect,
  XTime,
  useWebKit,
  useWebKitLayout,
} from '@novelia/web-kit';
import { ref } from 'vue';

const { whoami } = useWebKit();
const { scrollToTop } = useWebKitLayout();

const selected = ref('alpha');
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
    <section class="border-border bg-surface rounded-lg border p-5">
      <h1 class="mb-2 text-lg font-medium">web-kit playground</h1>
      <p class="text-muted text-sm">
        这里以源码方式引入 <code>@novelia/web-kit</code>，改
        <code>packages/web-kit/src</code> 下的组件或 CSS 会立即热更新，不需要先
        build，也不需要宿主应用。
      </p>
    </section>

    <section class="border-border bg-surface rounded-lg border p-5">
      <h2 class="mb-3 font-medium">会话</h2>
      <p class="text-sm">
        登录状态：{{ whoami.isSignedIn ? (whoami.user?.username ?? '已登录') : '未登录' }}
      </p>
      <p class="text-muted mt-1 text-xs">
        auth.url 指向相对地址 <code>/auth</code>，playground
        里不会有真实会话，用来验证未登录态的表现。
      </p>
    </section>

    <section
      class="border-border bg-surface flex flex-wrap items-center gap-3 rounded-lg border p-5"
    >
      <h2 class="w-full font-medium">UI</h2>
      <XButton @click="Notify.success('操作成功')">成功通知</XButton>
      <XButton variant="danger" @click="Notify.error('操作失败')">
        失败通知
      </XButton>
      <XButton variant="ghost" @click="Notify.dismissAll()">清空通知</XButton>
      <XButton variant="ghost" @click="scrollToTop({ behavior: 'smooth' })">
        滚回顶部
      </XButton>
      <div class="w-48">
        <XSelect v-model="selected" :options="options" />
      </div>
    </section>

    <section class="border-border bg-surface rounded-lg border p-5">
      <h2 class="mb-3 font-medium">时间</h2>
      <dl class="grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
        <dt class="text-muted">默认格式</dt>
        <dd><XTime :time="sampleTime" /></dd>
        <dt class="text-muted">自定义格式</dt>
        <dd><XTime :time="sampleTime" format="yyyy年M月d日 HH:mm" /></dd>
        <dt class="text-muted">相对时间</dt>
        <dd>
          <XTime :time="sampleTime" format="relative" :to="relativeBase" />
        </dd>
        <dt class="text-muted">非法值</dt>
        <dd>
          <XTime time="not-a-date" />
          （不渲染）
        </dd>
      </dl>
    </section>

    <section class="border-border bg-surface rounded-lg border p-5">
      <h2 class="mb-3 font-medium">长内容（验证布局内滚动）</h2>
      <p v-for="index in 40" :key="index" class="text-muted py-1 text-sm">
        第 {{ index }} 行
      </p>
    </section>
  </div>
</template>
