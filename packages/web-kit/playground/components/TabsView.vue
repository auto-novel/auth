<script setup lang="ts">
import {
  XTabs,
  XTabsContent,
  XTabsList,
  XTabsTrigger,
  type XTabsValue,
} from '@novelia/web-kit';
import { ref } from 'vue';

import ComponentPage from './ComponentPage.vue';

const tab = ref<XTabsValue>('overview');
const manualTab = ref<XTabsValue>('profile');
const code = `const tab = ref('overview');

<XTabs v-model="tab">
  <XTabsList aria-label="项目内容">
    <XTabsTrigger value="overview">概览</XTabsTrigger>
    <XTabsTrigger value="draft">草稿</XTabsTrigger>
    <XTabsTrigger value="locked" disabled>不可用</XTabsTrigger>
  </XTabsList>
  <XTabsContent value="overview">概览内容</XTabsContent>
  <XTabsContent value="draft" force-mount>
    <label>草稿标题<input placeholder="切换后保留输入" /></label>
  </XTabsContent>
</XTabs>

<XTabs default-value="profile" orientation="vertical" activation-mode="manual">
  <XTabsList aria-label="个人设置">
    <XTabsTrigger value="profile">资料</XTabsTrigger>
    <XTabsTrigger value="privacy">隐私</XTabsTrigger>
  </XTabsList>
  <XTabsContent value="profile">资料设置</XTabsContent>
  <XTabsContent value="privacy">隐私设置</XTabsContent>
</XTabs>`;
</script>

<template>
  <ComponentPage
    title="标签页 · XTabs"
    description="组合标签列表、触发器和内容面板，支持受控状态、纵向键盘导航与保留面板挂载。"
    :code="code"
  >
    <section class="min-w-0">
      <h2 class="mb-2 font-medium">受控状态与禁用项</h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        v-model
        同步当前值；自动激活模式下，用左右方向键聚焦时也会切换内容。禁用项会被跳过。
      </p>
      <XTabs v-model="tab">
        <XTabsList aria-label="项目内容" class="overflow-x-auto">
          <XTabsTrigger value="overview" class="shrink-0">概览</XTabsTrigger>
          <XTabsTrigger value="activity" class="shrink-0">动态</XTabsTrigger>
          <XTabsTrigger value="locked" disabled class="shrink-0">
            不可用
          </XTabsTrigger>
        </XTabsList>
        <XTabsContent value="overview">
          <div
            class="rounded-sm border border-border bg-surface p-4 text-sm leading-6"
          >
            项目概览。试试点击“动态”，或聚焦标签后使用方向键切换。
          </div>
        </XTabsContent>
        <XTabsContent value="activity">
          <div
            class="rounded-sm border border-border bg-surface p-4 text-sm leading-6"
          >
            最近动态：已更新项目资料。标签值通过 update:modelValue 同步。
          </div>
        </XTabsContent>
      </XTabs>
      <p class="mt-3 text-sm text-muted" role="status">当前值：{{ tab }}</p>
    </section>

    <section class="min-w-0 border-t border-divider pt-6">
      <h2 class="mb-2 font-medium">纵向布局 · 手动激活</h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        上下方向键只移动焦点，Enter
        或空格才激活面板。观察当前值，区分“聚焦”与“选中”。
      </p>
      <XTabs
        v-model="manualTab"
        orientation="vertical"
        activation-mode="manual"
      >
        <XTabsList aria-label="个人设置" class="max-w-28">
          <XTabsTrigger value="profile">资料</XTabsTrigger>
          <XTabsTrigger value="privacy">隐私</XTabsTrigger>
          <XTabsTrigger value="billing" disabled>账单</XTabsTrigger>
        </XTabsList>
        <XTabsContent value="profile" class="text-sm leading-6">
          资料面板：先按 ↓ 聚焦“隐私”，内容仍停留在这里，再按 Enter 激活。
        </XTabsContent>
        <XTabsContent value="privacy" class="text-sm leading-6">
          隐私面板已激活。使用 ↑ 返回“资料”，按空格确认切换。
        </XTabsContent>
      </XTabs>
      <p class="mt-3 text-sm text-muted" role="status">
        当前值：{{ manualTab }}
      </p>
    </section>

    <section class="min-w-0 border-t border-divider pt-6">
      <h2 class="mb-2 font-medium">force-mount · 保留输入状态</h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        输入文字后切换到预览，再返回草稿。输入框没有绑定
        v-model，依靠面板持续挂载保留原生输入状态；未激活面板仍然隐藏。
      </p>
      <XTabs default-value="draft">
        <XTabsList aria-label="草稿编辑">
          <XTabsTrigger value="draft">草稿</XTabsTrigger>
          <XTabsTrigger value="preview">预览</XTabsTrigger>
        </XTabsList>
        <XTabsContent value="draft" force-mount>
          <label class="flex max-w-md flex-col gap-2 text-sm">
            草稿标题
            <input
              type="text"
              placeholder="输入一些文字，然后切换标签"
              class="min-w-0 w-full rounded-sm border border-border bg-surface px-3 py-2 text-ink outline-none placeholder:text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>
        </XTabsContent>
        <XTabsContent value="preview" class="text-sm leading-6 text-muted">
          这是独立的预览面板。返回“草稿”检查输入内容是否保留。
        </XTabsContent>
      </XTabs>
    </section>

    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">API 与键盘</h2>
      <ul class="space-y-2 text-sm leading-6 text-muted">
        <li>
          XTabs：v-model 接受 string | number；default-value
          设置非受控初值；orientation 为 horizontal（默认）或
          vertical；activation-mode 为 automatic（默认）或 manual。
        </li>
        <li>
          XTabsList：loop 默认为 true，允许首尾循环；用 aria-label 命名标签组。
          XTabsTrigger 的 value 与面板对应，disabled 禁用该标签。
        </li>
        <li>
          XTabsContent：value 关联标签；force-mount
          保持挂载而非保持可见。默认切离时卸载内容。
        </li>
        <li>
          Tab 进入标签组；横向 ← / →、纵向 ↑ / ↓ 移动焦点；Home / End
          跳至首尾可用项。 manual 模式用 Enter / 空格激活，Tab
          继续移向面板中的控件。
        </li>
      </ul>
    </section>
  </ComponentPage>
</template>
