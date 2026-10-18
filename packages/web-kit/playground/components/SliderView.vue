<script setup lang="ts">
import { XSlider } from '@novelia/web-kit';
import { ref } from 'vue';
import ComponentPage from './ComponentPage.vue';

const value = ref(0);
const decimalValue = ref(0.5);
const changeCount = ref(0);
const lastChangedValue = ref<number>();
const code = `<XSlider v-model="value" name="volume" aria-label="音量" />
<XSlider
  v-model="decimalValue"
  :min="0"
  :max="1"
  :step="0.1"
  aria-label="精细调节"
  @commit="onChange"
/>

// commit 携带本次提交值
function onChange(value: number) {
  console.log(value);
}`;

function onChange(value: number) {
  changeCount.value += 1;
  lastChangedValue.value = value;
}
</script>

<template>
  <ComponentPage
    title="滑块 · XSlider"
    description="用数字 v-model 绑定数值，支持范围、步长、禁用状态和 commit 通知。"
    :code="code"
  >
    <section aria-labelledby="test-slider" class="border-t border-divider pt-6">
      <h2 id="test-slider" class="mb-2 font-medium">基本用法与禁用</h2>
      <p class="mb-4 text-sm text-muted">
        拖动滑块或使用方向键调节；默认范围为 0–100，步长为 1。
      </p>
      <div class="grid gap-6 sm:grid-cols-2">
        <label class="flex flex-col gap-2 text-sm text-muted">
          音量 · {{ value }}
          <XSlider v-model="value" name="volume" aria-label="音量" />
        </label>
        <label class="flex flex-col gap-2 text-sm text-muted">
          禁用 · {{ value }}
          <XSlider v-model="value" disabled aria-label="禁用音量" />
        </label>
      </div>
    </section>
    <section
      aria-labelledby="test-slider-decimal"
      class="border-t border-divider pt-6"
    >
      <h2 id="test-slider-decimal" class="mb-3 font-medium">
        小数步长与 commit
      </h2>
      <label class="flex max-w-sm flex-col gap-2 text-sm text-muted">
        精细调节 · {{ decimalValue.toFixed(1) }}
        <XSlider
          v-model="decimalValue"
          :min="0"
          :max="1"
          :step="0.1"
          aria-label="精细调节"
          @commit="onChange"
        />
      </label>
      <p class="mt-3 text-xs text-muted" aria-live="polite">
        commit 次数：{{ changeCount }} · 最近提交值：{{
          lastChangedValue ?? '尚未提交'
        }}
      </p>
    </section>
    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">接口与交互</h2>
      <p class="text-sm leading-6 text-muted">
        v-model 默认为 0；min、max、step 默认分别为 0、100、1。disabled
        禁用交互，name 用于表单字段命名。使用 label 或 aria-label 为滑块命名。
        v-model 在拖动时实时更新；commit
        在拖动结束或键盘调节提交时触发，携带提交值。
      </p>
    </section>
  </ComponentPage>
</template>
