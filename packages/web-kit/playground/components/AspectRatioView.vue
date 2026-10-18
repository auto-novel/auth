<script setup lang="ts">
import { XAspectRatio } from '@novelia/web-kit';
import ComponentPage from './ComponentPage.vue';

const code = `<XAspectRatio :ratio="16 / 9">
  <div class="flex size-full items-center justify-center bg-surface">
    16:9 内容
  </div>
</XAspectRatio>

<XAspectRatio>
  <div class="flex size-full items-center justify-center bg-surface">
    1:1 内容（默认）
  </div>
</XAspectRatio>`;
</script>

<template>
  <ComponentPage
    title="宽高比 · XAspectRatio"
    description="为默认插槽内容保留固定宽高比，随容器宽度自适应。"
    :code="code"
  >
    <section
      aria-labelledby="test-aspect-ratio"
      class="border-t border-divider pt-6"
    >
      <h2 id="test-aspect-ratio" class="mb-2 font-medium">16:9 与默认正方形</h2>
      <p class="mb-4 text-sm text-muted">
        调整窗口宽度，检查两个容器保持各自比例；插槽内容可用于图片、视频或占位展示。
      </p>
      <div class="grid items-start gap-6 sm:grid-cols-2">
        <div>
          <h3 class="mb-2 text-sm text-muted">ratio = 16 / 9</h3>
          <XAspectRatio :ratio="16 / 9">
            <div
              class="flex size-full items-center justify-center rounded-sm border border-border bg-surface text-primary"
            >
              16:9 内容
            </div>
          </XAspectRatio>
        </div>
        <div>
          <h3 class="mb-2 text-sm text-muted">ratio = 1（默认）</h3>
          <XAspectRatio>
            <div
              class="flex size-full items-center justify-center rounded-sm border border-border bg-surface text-primary"
            >
              1:1 内容
            </div>
          </XAspectRatio>
        </div>
      </div>
    </section>
    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">接口与布局</h2>
      <p class="text-sm leading-6 text-muted">
        ratio 表示宽度除以高度，默认为 1；例如 16 / 9
        表示横向宽屏。内容通过默认插槽传入， 可使用 size-full
        填满容器，图片可配合 object-cover 控制裁切。
      </p>
    </section>
  </ComponentPage>
</template>
