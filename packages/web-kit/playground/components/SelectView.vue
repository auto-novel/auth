<script setup lang="ts">
import { XSelect, type XSelectUi } from '@novelia/web-kit';
import { ref } from 'vue';
import ComponentPage from './ComponentPage.vue';

const selected = ref('alpha');
const scrollSelected = ref('option-1');
const options = [
  { label: '选项 A', value: 'alpha' },
  { label: '选项 B', value: 'beta' },
  { label: '选项 C', value: 'gamma' },
];
const scrollOptions = Array.from({ length: 30 }, (_, index) => ({
  label: `选项 ${index + 1}`,
  value: `option-${index + 1}`,
}));
const selectUi = {
  trigger: ['rounded-lg', { 'border-primary': true }],
  content: 'rounded-lg p-2',
  viewport: 'max-h-80',
  item: 'h-11 rounded-md',
} as const satisfies XSelectUi;

const code = `<XSelect v-model="selected" :options="options" aria-label="选择选项" />

<XSelect
  v-model="selected"
  :options="options"
  :ui="{ trigger: 'rounded-lg', content: 'p-2', item: 'h-11 rounded-md' }"
  class="rounded-none"
  aria-label="自定义选择器"
/>`;
</script>

<template>
  <ComponentPage
    title="选择器 · XSelect"
    description="用字符串 v-model 绑定选中值，支持键盘选择、禁用状态和长列表滚动。"
    :code="code"
  >
    <section aria-labelledby="test-select" class="border-t border-divider pt-6">
      <h2 id="test-select" class="mb-2 font-medium">选择器 · XSelect</h2>
      <p class="mb-4 text-sm text-muted">
        检查选项切换、键盘操作和禁用状态；长列表可通过滚轮、拖动滚动条或方向键浏览，切换主题检查滚动条配色。
      </p>
      <div class="flex flex-wrap gap-4">
        <label class="flex w-48 flex-col gap-2 text-sm text-muted">
          正常
          <XSelect
            v-model="selected"
            :options="options"
            aria-label="示例选项"
          />
        </label>
        <label class="flex w-48 flex-col gap-2 text-sm text-muted">
          禁用
          <XSelect
            v-model="selected"
            :options="options"
            disabled
            aria-label="禁用示例选项"
          />
        </label>
        <label class="flex w-48 flex-col gap-2 text-sm text-muted">
          长列表 · 30 项
          <XSelect
            v-model="scrollSelected"
            :options="scrollOptions"
            aria-label="滚动条示例选项"
          />
        </label>
      </div>
      <p class="mt-3 text-xs text-muted">
        当前值：{{ selected }} · 长列表当前值：{{ scrollSelected }}
      </p>
    </section>
    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">分区样式覆盖</h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        ui.trigger 定制触发器，ui.content、ui.viewport 和 ui.item 定制浮层内部。
        此例 ui.trigger 设置圆角，class="rounded-none"
        最后覆盖它；打开菜单可检查选项高度和浮层内边距。
      </p>
      <XSelect
        v-model="scrollSelected"
        :options="scrollOptions"
        :ui="selectUi"
        class="w-64 rounded-none"
        aria-label="分区样式示例"
      />
    </section>
    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">接口与交互</h2>
      <p class="text-sm leading-6 text-muted">
        options 中的 value 应为唯一字符串；使用 label 或 aria-label
        为选择器命名。disabled 禁用交互，required 标记必选。 update:modelValue
        携带最新值；class、id 和 aria-* 属性直接作用于触发控件。
      </p>
    </section>
  </ComponentPage>
</template>
