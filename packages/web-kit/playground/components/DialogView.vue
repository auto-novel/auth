<script setup lang="ts">
import { XButton, XDialog } from '@novelia/web-kit';
import { ref } from 'vue';
import ComponentPage from './ComponentPage.vue';

const open = ref(false);
const longOpen = ref(false);
const slotsOpen = ref(false);
const customScrollOpen = ref(false);
const fullScreenOpen = ref(false);
const lockedOpen = ref(false);
const code = `<XDialog v-model:open="open" title="编辑资料" description="填写名称后保存。"
  class="w-xl">
  <template #trigger>
    <XButton color="neutral" variant="outline">编辑资料</XButton>
  </template>
  <!-- 标题和描述已默认可见，正文无需重复添加。 -->
  <label class="flex flex-col gap-2">名称<input /></label>
  <template #footer>
    <XButton color="neutral" variant="outline" @click="open = false">取消</XButton>
    <XButton @click="open = false">保存</XButton>
  </template>
</XDialog>`;
</script>

<template>
  <ComponentPage
    title="对话框 · XDialog"
    description="默认可见的标题与描述、独立滚动正文及固定页脚，也可自行安排滚动或全屏布局。"
    :code="code"
  >
    <section class="border-t border-divider pt-6">
      <h2 class="mb-2 font-medium">基础表单与 footer</h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        title 和 description 已默认可见，不必在默认插槽重复写标题或描述。
        trigger 打开对话框，footer 固定在底部；Tab
        焦点限制在框内，关闭后回到触发按钮。
      </p>
      <XDialog
        v-model:open="open"
        title="编辑资料"
        description="填写名称后保存。"
        class="w-xl"
      >
        <template #trigger>
          <XButton color="neutral" variant="outline">编辑资料</XButton>
        </template>
        <form id="dialog-profile-form" @submit.prevent="open = false">
          <label class="flex flex-col gap-2 text-sm">
            名称
            <input
              required
              class="rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus-visible:border-primary"
              placeholder="输入名称测试焦点"
            />
          </label>
        </form>
        <template #footer>
          <XButton color="neutral" variant="outline" @click="open = false">
            取消
          </XButton>
          <XButton type="submit" form="dialog-profile-form">保存</XButton>
        </template>
      </XDialog>
    </section>

    <section class="border-t border-divider pt-6">
      <h2 class="mb-2 font-medium">长正文 · 固定页脚</h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        在 root 上通过 class 设置宽高；scrollable 默认
        true，正文自动收缩并独立滚动，标题和页脚保持可见。
      </p>
      <XDialog
        v-model:open="longOpen"
        title="阅读说明"
        description="滚动正文，检查底部操作始终可见。"
        class="h-[32rem] w-2xl"
      >
        <template #trigger>
          <XButton color="neutral" variant="outline">查看长正文</XButton>
        </template>
        <div class="space-y-4 text-sm leading-6 text-muted">
          <p v-for="item in 16" :key="item">
            第
            {{ item }}
            段：这里只滚动正文，不会把标题和页脚一起卷走。窄屏时仍受视口最大高度限制。
          </p>
        </div>
        <template #footer>
          <XButton @click="longOpen = false">已阅读</XButton>
        </template>
      </XDialog>
    </section>

    <section class="border-t border-divider pt-6">
      <h2 class="mb-2 font-medium">自定义 title / description 插槽</h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        插槽内容分别由 DialogTitle、DialogDescription
        渲染，保留可访问命名与描述，无需额外包一层标题元素。
      </p>
      <XDialog v-model:open="slotsOpen">
        <template #trigger>
          <XButton color="neutral" variant="outline">自定义标题与描述</XButton>
        </template>
        <template #title>
          发布预览
          <span class="ml-2 text-xs text-muted">草稿</span>
        </template>
        <template #description>
          检查内容后再发布，
          <strong class="font-medium">不会立即对外可见</strong>
          。
        </template>
        <p class="text-sm leading-6">默认插槽只放正文内容。</p>
        <template #footer>
          <XButton @click="slotsOpen = false">完成</XButton>
        </template>
      </XDialog>
    </section>

    <section class="border-t border-divider pt-6">
      <h2 class="mb-2 font-medium">自行安排滚动与浮层挂载点</h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        scrollable=false 时正文容器为 flex min-h-0 flex-1 flex-col，不设置
        overflow。 ui.body="p-0" 覆盖默认 p-5 sm:p-6
        内边距；工具栏、内部滚动区和滚动区外浮层挂载点由调用方布局。
      </p>
      <XDialog
        v-model:open="customScrollOpen"
        title="自定义正文布局"
        description="仅中间列表滚动，工具栏与浮层挂载点在滚动区之外。"
        class="h-[32rem] w-2xl"
        :ui="{ body: 'p-0' }"
        :scrollable="false"
      >
        <template #trigger>
          <XButton color="neutral" variant="outline">查看自定义滚动</XButton>
        </template>
        <div
          class="flex shrink-0 items-center justify-between border-b border-divider px-5 py-3"
        >
          <span class="text-sm font-medium">固定工具栏</span>
          <XButton
            size="sm"
            color="neutral"
            variant="outline"
            @click="customScrollOpen = false"
          >
            完成
          </XButton>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto p-5">
          <p v-for="item in 20" :key="item" class="py-3 text-sm text-muted">
            列表项 {{ item }}
          </p>
        </div>
        <div
          id="dialog-overlay-host"
          class="relative shrink-0 border-t border-divider px-5 py-3 text-xs text-muted"
        >
          本地浮层挂载点 #dialog-overlay-host（不在 overflow-y-auto 内）
        </div>
        <template #footer>
          <XButton @click="customScrollOpen = false">关闭</XButton>
        </template>
      </XDialog>
    </section>

    <section class="border-t border-divider pt-6">
      <h2 class="mb-2 font-medium">无可见标题 · 禁止自动关闭</h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        不提供 title / #title 时，必须用 aria-label（或
        aria-labelledby）保留可访问命名。 closable=false 隐藏关闭按钮，并禁用
        Escape 和遮罩关闭，仍可通过 v-model:open 主动关闭。
      </p>
      <XDialog
        v-model:open="lockedOpen"
        aria-label="操作确认"
        :closable="false"
      >
        <template #trigger>
          <XButton color="neutral" variant="outline">打开无标题确认</XButton>
        </template>
        <p class="text-sm leading-6 text-muted">
          尝试点击遮罩或按 Escape，对话框会保持打开。请使用下方按钮结束操作。
        </p>
        <template #footer>
          <XButton @click="lockedOpen = false">确认并关闭</XButton>
        </template>
      </XDialog>
    </section>

    <section class="border-t border-divider pt-6">
      <h2 class="mb-2 font-medium">全屏 · 无装饰布局</h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        fullScreen=true 保持无装饰、无正文容器：title / description
        仅供读屏，默认插槽和 footer 直接提供内容。 ui.body / scrollable
        不参与全屏布局，内边距、可见标题、滚动及页脚样式均自行安排。
      </p>
      <XDialog
        v-model:open="fullScreenOpen"
        title="全屏工作区"
        description="由调用方安排工具栏、正文滚动和底部操作。"
        class="flex flex-col"
        full-screen
      >
        <template #trigger>
          <XButton color="neutral" variant="outline">打开全屏工作区</XButton>
        </template>
        <header class="shrink-0 border-b border-divider px-6 py-4 pr-16">
          <h2 class="font-medium">全屏工作区</h2>
        </header>
        <main class="min-h-0 flex-1 overflow-y-auto p-6">
          <p class="text-sm text-muted">
            这里是调用方自行布局的正文，没有默认内边距、边框或圆角装饰。
          </p>
        </main>
        <template #footer>
          <footer
            class="flex shrink-0 justify-end border-t border-divider px-6 py-4"
          >
            <XButton @click="fullScreenOpen = false">退出全屏</XButton>
          </footer>
        </template>
      </XDialog>
    </section>

    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">接口说明</h2>
      <ul class="space-y-2 text-sm leading-6 text-muted">
        <li>
          v-model:open 控制开关；#trigger 保留，默认插槽为正文，#footer
          为固定底部操作区。
        </li>
        <li>
          title?: string / #title 提供默认可见标题，description / #description
          提供默认可见描述；插槽可自定义内容。
        </li>
        <li>
          宽高使用 root class / style（如 class="h-[32rem] w-2xl"）；不使用
          contentStyle / contentMaxHeight。
        </li>
        <li>
          ui.body 控制正文容器 class，默认内边距 p-5 sm:p-6，可用 p-0
          覆盖；scrollable?: boolean 默认 true，false 时自行设置内部滚动区。
        </li>
        <li>
          closeLabel 可自定义关闭按钮的无障碍名称；无 title / #title 时请提供
          aria-label 或 aria-labelledby。
        </li>
      </ul>
    </section>
  </ComponentPage>
</template>
