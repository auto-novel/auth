<script setup lang="ts">
import { XPagination } from '@novelia/web-kit';
import { ref } from 'vue';
import ComponentPage from './ComponentPage.vue';

const page = ref(2);
const code =
  '<XPagination\n  v-model:page="page"\n  :total-pages="20"\n  keyboard\n/>';
</script>

<template>
  <ComponentPage
    title="分页 · XPagination"
    description="通过 v-model:page 控制页码，支持跳页面板、响应式外观和可选的全局方向键。"
    :code="code"
  >
    <section
      aria-labelledby="test-pagination"
      class="border-t border-divider pt-6"
    >
      <h2 id="test-pagination" class="mb-2 font-medium">分页 · XPagination</h2>
      <p class="mb-4 text-sm text-muted">
        检查上一页、下一页和页码切换；已开启左右方向键翻页，输入框和弹窗内不触发。桌面端点击省略号，移动端点击中间页数，可跳转到指定页，支持回车确认。
      </p>
      <XPagination v-model:page="page" :total-pages="20" keyboard />
      <p class="mt-3 text-xs text-muted">当前页：{{ page }} / 20</p>
    </section>
    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">接口与交互</h2>
      <p class="text-sm leading-6 text-muted">
        页码从 1 开始。totalPages 表示总页数，不是记录数。keyboard
        默认关闭，同页仅应开启一个分页条；输入框和弹窗内不会触发全局翻页。桌面点击省略号、移动端点击中间页数打开跳页面板。
      </p>
    </section>
  </ComponentPage>
</template>
