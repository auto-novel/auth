<script setup lang="ts">
import { XSwitch } from '@novelia/web-kit';
import { ref } from 'vue';
import ComponentPage from './ComponentPage.vue';

const enabled = ref(false);
const changeCount = ref(0);
const code = `<XSwitch
  v-model="enabled"
  name="notifications"
  value="enabled"
  aria-label="接收通知"
  @change="onChange"
/>`;

function onChange() {
  changeCount.value += 1;
}
</script>

<template>
  <ComponentPage
    title="开关 · XSwitch"
    description="用布尔 v-model 控制开关，支持禁用、必选标记和表单字段。"
    :code="code"
  >
    <section aria-labelledby="test-switch" class="border-t border-divider pt-6">
      <h2 id="test-switch" class="mb-2 font-medium">基本用法与禁用</h2>
      <p class="mb-4 text-sm text-muted">
        点击或使用 Tab 聚焦后按空格切换，检查开关状态与禁用外观。
      </p>
      <div class="flex flex-wrap gap-6">
        <label class="flex items-center gap-3 text-sm text-muted">
          <XSwitch
            v-model="enabled"
            name="notifications"
            value="enabled"
            aria-label="接收通知"
            @change="onChange"
          />
          接收通知
        </label>
        <label class="flex items-center gap-3 text-sm text-muted">
          <XSwitch :model-value="false" disabled aria-label="禁用且关闭" />
          禁用且关闭
        </label>
        <label class="flex items-center gap-3 text-sm text-muted">
          <XSwitch :model-value="true" disabled aria-label="禁用且开启" />
          禁用且开启
        </label>
      </div>
      <p class="mt-3 text-xs text-muted" aria-live="polite">
        当前状态：{{ enabled ? '开启' : '关闭' }} · change 次数：{{
          changeCount
        }}
      </p>
    </section>
    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">接口与交互</h2>
      <p class="text-sm leading-6 text-muted">
        v-model 默认为 false；disabled 禁用交互，required 标记必选，name 和
        value 设置表单字段名与选中时提交的值，不改变布尔模型。使用 label 或
        aria-label 为开关命名。change 事件不携带参数，请从 v-model
        读取当前状态。
      </p>
    </section>
  </ComponentPage>
</template>
