<script setup lang="ts">
import {
  Toast,
  XActionMenu,
  XActionMenuItem,
  XButton,
  XConfirmDialog,
} from '@novelia/web-kit';
import { ref } from 'vue';
import ComponentPage from './ComponentPage.vue';

const confirmOpen = ref(false);
function confirm() {
  Toast.success('示例操作完成');
  confirmOpen.value = false;
}
const menuAlignments = ['start', 'end'] as const;
const code =
  '<XActionMenu align="end">\n  <XActionMenuItem @activate="edit">编辑</XActionMenuItem>\n  <XActionMenuItem danger @activate="confirmOpen = true">删除</XActionMenuItem>\n</XActionMenu>\n<XConfirmDialog\n  v-model:open="confirmOpen"\n  title="确认删除"\n  description="删除后无法恢复。"\n  danger\n  @confirm="async () => { await remove(); confirmOpen = false; }"\n/>';
</script>

<template>
  <ComponentPage
    title="操作菜单与确认框"
    description="组合 XActionMenu、XActionMenuItem 和 XConfirmDialog，展示菜单对齐、禁用项和危险操作确认。"
    :code="code"
  >
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
            <XActionMenuItem @activate="Toast.success('已选择编辑')">
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
        @confirm="confirm"
      />
    </section>
    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">接口与交互</h2>
      <p class="text-sm leading-6 text-muted">
        菜单通过 side 和 align 控制位置，compact 使用紧凑尺寸。菜单项使用
        activate 事件，danger 仅改变外观，不自动确认。确认框使用 v-model:open
        控制开关，confirm 只通知操作，由调用方在成功后关闭；loading
        阻止交互关闭及重复确认。
      </p>
    </section>
  </ComponentPage>
</template>
