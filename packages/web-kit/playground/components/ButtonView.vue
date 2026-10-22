<script setup lang="ts">
import {
  Toast,
  XButton,
  type XButtonColor,
  type XButtonVariant,
} from '@novelia/web-kit';

import ComponentPage from './ComponentPage.vue';

const colors: XButtonColor[] = ['primary', 'neutral', 'danger', 'warning'];
const variants: XButtonVariant[] = ['solid', 'soft', 'outline', 'ghost'];
const code = `<XButton>主要操作</XButton>
<XButton color="neutral" variant="outline">取消</XButton>
<XButton color="danger" variant="soft">删除</XButton>
<XButton color="warning" variant="soft" size="tiny">紧凑按钮</XButton>
<XButton disabled>禁用</XButton>
<XButton loading>加载中</XButton>`;
</script>

<template>
  <ComponentPage
    title="按钮 · XButton"
    description="语义色与外观独立组合，支持紧凑尺寸、禁用和加载状态。"
    :code="code"
  >
    <section aria-labelledby="test-buttons">
      <h2 id="test-buttons" class="mb-2 font-medium">按钮 · XButton</h2>
      <p class="mb-4 text-sm text-muted">
        悬停查看 hover 色，使用 Tab 检查 focus-visible；每种语义色展示
        solid、soft、outline、ghost，以及紧凑、禁用和加载状态，加载时保留文字并禁止点击。
      </p>
      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="color in colors"
          :key="color"
          class="flex flex-wrap items-center gap-3 rounded-sm border border-border p-3"
        >
          <code class="w-24 text-xs text-muted">{{ color }}</code>
          <XButton
            v-for="variant in variants"
            :key="variant"
            :color="color"
            :variant="variant"
            @click="Toast.success(`点击了 ${color} ${variant} 按钮`)"
          >
            {{ variant }}
          </XButton>
          <XButton :color="color" variant="soft" size="tiny">紧凑按钮</XButton>
          <XButton :color="color" disabled>禁用</XButton>
          <XButton :color="color" loading>加载中</XButton>
        </div>
      </div>
    </section>
  </ComponentPage>
</template>
