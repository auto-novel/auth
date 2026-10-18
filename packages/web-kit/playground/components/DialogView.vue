<script setup lang="ts">
import { XButton, XDialog } from '@novelia/web-kit';
import { ref } from 'vue';
import ComponentPage from './ComponentPage.vue';

const open = ref(false);
const fullScreenOpen = ref(false);
const lockedOpen = ref(false);
const code = `<XDialog v-model:open="open" title="示例对话框" description="对话框说明">
  <template #trigger>
    <XButton variant="outline">打开对话框</XButton>
  </template>
  <h2 class="mb-3 pr-10 font-medium">示例对话框</h2>
  <p>自定义内容</p>
  <XButton class="mt-6" @click="open = false">完成</XButton>
</XDialog>`;
</script>

<template>
  <ComponentPage
    title="对话框 · XDialog"
    description="受控开关、自定义内容与全屏布局，支持焦点管理和键盘关闭。"
    :code="code"
  >
    <section class="border-t border-divider pt-6">
      <h2 class="mb-2 font-medium">基本用法</h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        通过 trigger 插槽打开；点击右上角无背景关闭按钮、遮罩或按 Escape
        关闭。使用 Tab 检查焦点限制在对话框内，关闭后焦点回到触发按钮。
      </p>
      <XDialog
        v-model:open="open"
        title="示例对话框"
        description="可在此填写内容并完成操作。"
      >
        <template #trigger>
          <XButton variant="outline">打开对话框</XButton>
        </template>
        <h2 class="mb-3 pr-10 font-medium">示例对话框</h2>
        <p class="text-sm leading-6 text-muted">可在此填写内容并完成操作。</p>
        <label class="mt-4 flex flex-col gap-2 text-sm">
          名称
          <input
            class="rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus-visible:border-primary"
            placeholder="输入名称测试焦点"
          />
        </label>
        <div class="mt-6 flex justify-end gap-3">
          <XButton variant="outline" @click="open = false">取消</XButton>
          <XButton @click="open = false">完成</XButton>
        </div>
      </XDialog>
    </section>

    <section class="border-t border-divider pt-6">
      <h2 class="mb-2 font-medium">全屏布局</h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        fullScreen 占满可见视口，内容的内边距和滚动由调用方控制。
      </p>
      <XDialog v-model:open="fullScreenOpen" title="全屏对话框" full-screen>
        <template #trigger>
          <XButton variant="outline">打开全屏对话框</XButton>
        </template>
        <div class="h-full overflow-y-auto p-6">
          <h2 class="mb-3 pr-10 font-medium">全屏对话框</h2>
          <p class="text-sm text-muted">可用于编辑器、预览或较复杂的表单。</p>
          <XButton class="mt-6" @click="fullScreenOpen = false">完成</XButton>
        </div>
      </XDialog>
    </section>

    <section class="border-t border-divider pt-6">
      <h2 class="mb-2 font-medium">禁止自动关闭</h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        closable=false 隐藏关闭按钮，并禁用 Escape 和遮罩关闭；仍可通过
        v-model:open 主动关闭。
      </p>
      <XDialog v-model:open="lockedOpen" title="需要主动关闭" :closable="false">
        <template #trigger>
          <XButton variant="outline">打开不可自动关闭的对话框</XButton>
        </template>
        <h2 class="mb-3 font-medium">需要主动关闭</h2>
        <p class="text-sm leading-6 text-muted">
          尝试点击遮罩或按 Escape，对话框会保持打开。
        </p>
        <XButton class="mt-6" @click="lockedOpen = false">确认并关闭</XButton>
      </XDialog>
    </section>

    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">接口说明</h2>
      <p class="text-sm leading-6 text-muted">
        使用 v-model:open 控制开关，title 必填，description
        可选；两者用于无障碍命名， 可见标题和正文通过默认插槽提供。closeLabel
        可自定义关闭按钮的无障碍名称。
      </p>
    </section>
  </ComponentPage>
</template>
