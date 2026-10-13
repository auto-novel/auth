<script setup lang="ts">
import {
  Toast,
  XButton,
  XTime,
  XTooltip,
  type XButtonVariant,
} from '@novelia/web-kit';
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

const editableToastId = ref<string>();
function showEditableToast() {
  editableToastId.value = Toast.info(
    '这条消息不会自动关闭，可更新或单独关闭。',
    {
      id: 'playground-editable-toast',
      duration: 0,
      onClose: () => {
        editableToastId.value = undefined;
      },
    },
  );
}
function updateEditableToast() {
  if (editableToastId.value) {
    Toast.update(editableToastId.value, {
      message: '消息已更新，将在 3 秒后关闭。',
      status: 'success',
      duration: 3000,
    });
  }
}
function dismissEditableToast() {
  if (editableToastId.value) Toast.dismiss(editableToastId.value);
}

const componentPages = [
  {
    to: '/components/drawer',
    title: '抽屉 · XDrawer',
    description: '四方向、尺寸控制、受控开关与拖动关闭。',
  },
  {
    to: '/components/select',
    title: '选择器 · XSelect',
    description: '值绑定、禁用状态、键盘操作与长列表。',
  },
  {
    to: '/components/action-menu',
    title: '操作菜单与确认框',
    description: '对齐、菜单项状态与危险操作确认流程。',
  },
  {
    to: '/components/pagination',
    title: '分页 · XPagination',
    description: '受控页码、跳页与全局键盘翻页。',
  },
  {
    to: '/components/async-content',
    title: '异步内容 · XAsyncContent',
    description: '加载、错误重试、空状态和正常内容。',
  },
];
async function showPromiseToast(fail = false) {
  await Toast.promise(
    new Promise<string>((resolve, reject) => {
      setTimeout(() => {
        if (fail) reject(new Error('示例保存失败'));
        else resolve('示例设置');
      }, 1500);
    }),
    {
      loading: '正在保存…',
      success: '示例设置已保存',
      error: '示例保存失败',
    },
  );
}

const sampleTime = new Date('2025-06-05T15:04:30+08:00');
const relativeBase = new Date('2025-06-05T15:07:30+08:00');
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
            @click="Toast.success(`点击了 ${variant} 按钮`)"
          >
            示例按钮
          </XButton>
          <XButton :variant="variant" disabled>禁用</XButton>
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
          <XButton variant="outline">查看提示</XButton>
        </template>
        提示浮层与菜单使用相同的圆角和阴影。
      </XTooltip>
    </section>

    <section aria-labelledby="test-toast" class="border-t border-divider pt-6">
      <h2 id="test-toast" class="mb-2 font-medium">通知 · Toast</h2>
      <p class="mb-4 text-sm text-muted">
        检查四种通知、单条更新与关闭、生命周期、多行内容及 Promise 状态更新。
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <XButton @click="Toast.success('操作成功')">成功通知</XButton>
        <XButton variant="danger" @click="Toast.error('操作失败')">
          错误通知
        </XButton>
        <XButton
          variant="outline"
          @click="
            Toast.success(
              '设置已保存。\n这是一条多行通知，用于检查换行和浮层宽度。',
            )
          "
        >
          多行通知
        </XButton>
        <XButton variant="outline" @click="showPromiseToast()">
          Promise 成功
        </XButton>
        <XButton variant="outline" @click="showPromiseToast(true)">
          Promise 失败
        </XButton>
        <XButton variant="outline" @click="Toast.info('这是一条信息通知')">
          信息通知
        </XButton>
        <XButton
          variant="outline"
          @click="Toast.warning('请注意检查设置', { duration: 8000 })"
        >
          警告通知（8 秒）
        </XButton>
        <XButton variant="outline" @click="showEditableToast">常驻通知</XButton>
        <XButton
          variant="outline"
          :disabled="!editableToastId"
          @click="updateEditableToast"
        >
          更新通知
        </XButton>
        <XButton
          variant="outline"
          :disabled="!editableToastId"
          @click="dismissEditableToast"
        >
          单独关闭
        </XButton>
        <XButton variant="ghost" @click="Toast.dismissAll()">清空通知</XButton>
      </div>
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
