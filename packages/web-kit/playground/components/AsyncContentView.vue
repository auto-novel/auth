<script setup lang="ts">
import { XAsyncContent, XButton, XSelect } from '@novelia/web-kit';
import { computed, ref } from 'vue';
import ComponentPage from './ComponentPage.vue';

const state = ref('content');
const size = ref<'compact' | 'default' | 'large'>('default');
const retryCount = ref(0);
const retryable = ref(true);
const customLoading = ref(false);
const states = [
  { label: '正常内容', value: 'content' },
  { label: '加载中', value: 'loading' },
  { label: '加载失败', value: 'error' },
  { label: '空状态', value: 'empty' },
  { label: '加载 + 错误 + 空状态', value: 'all' },
];
const loading = computed(
  () => state.value === 'loading' || state.value === 'all',
);
const error = computed(() =>
  state.value === 'error' || state.value === 'all'
    ? '请求失败，这是模拟错误，不会发起网络请求。'
    : '',
);
const empty = computed(() => state.value === 'empty' || state.value === 'all');
function retry() {
  retryCount.value++;
  state.value = 'content';
}
const code = `<XAsyncContent
  :loading="loading"
  :error="error"
  :empty="items.length === 0"
  empty-title="暂无记录"
  @retry="reload"
>
  <!-- 默认显示加载动画，也可通过 #loading 自定义 -->
  <!-- 不提供 onRetry 时隐藏重试按钮 -->
  <!-- 正常内容 -->
</XAsyncContent>`;
</script>

<template>
  <ComponentPage
    title="异步内容 · XAsyncContent"
    description="统一展示加载、错误、空状态与正常内容；不负责请求数据，状态由调用方提供。"
    :code="code"
  >
    <section aria-labelledby="async-example">
      <h2 id="async-example" class="mb-3 font-medium">状态预览</h2>
      <div class="mb-4 flex flex-wrap gap-4">
        <label class="flex w-56 flex-col gap-2 text-sm text-muted">
          状态
          <XSelect
            v-model="state"
            :options="states"
            aria-label="异步内容状态"
          />
        </label>
        <label class="flex w-48 flex-col gap-2 text-sm text-muted">
          状态区尺寸
          <select
            v-model="size"
            class="min-h-10 rounded-sm border border-border bg-surface px-3 text-ink"
          >
            <option value="compact">compact</option>
            <option value="default">default</option>
            <option value="large">large</option>
          </select>
        </label>
        <label class="flex items-center gap-2 text-sm text-muted">
          <input v-model="retryable" type="checkbox" />
          显示重试按钮
        </label>
        <label class="flex items-center gap-2 text-sm text-muted">
          <input v-model="customLoading" type="checkbox" />
          自定义加载界面
        </label>
      </div>
      <div
        class="rounded-sm border border-border bg-surface"
        aria-live="polite"
      >
        <XAsyncContent
          :loading="loading"
          :error="error"
          :empty="empty"
          :on-retry="retryable ? retry : undefined"
          :size="size"
          empty-title="暂无记录"
          empty-description="试着切换到正常内容，或调整筛选条件。"
        >
          <template v-if="customLoading" #loading>
            <div
              class="grid min-h-52 place-items-center p-6 text-sm text-muted"
              role="status"
            >
              正在加载示例内容…
            </div>
          </template>
          <div class="p-6">
            <h3 class="mb-2 font-medium">内容已加载</h3>
            <p class="mb-4 text-sm text-muted">
              点击失败状态下的“再试一次”，会模拟恢复为正常内容。
            </p>
            <XButton color="neutral" variant="outline" @click="state = 'error'">
              模拟失败
            </XButton>
          </div>
        </XAsyncContent>
      </div>
      <p class="mt-3 text-xs text-muted">
        已模拟重试 {{ retryCount }} 次，无需连接后端。
      </p>
    </section>
    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">接口与状态优先级</h2>
      <ul class="list-inside list-disc space-y-2 text-sm leading-6 text-muted">
        <li>
          状态优先级：loading → 非空 error → empty → 默认内容；“加载 + 错误 +
          空状态”可验证优先级。
        </li>
        <li>默认显示加载动画和文案；#loading 插槽可完全替换默认加载界面。</li>
        <li>
          提供 onRetry 回调时才显示重试按钮；回调
          只通知调用方，不自动清除错误或发起请求。
        </li>
        <li>
          emptyTitle / emptyDescription 自定义空状态文案；errorTitle /
          retryLabel 自定义错误文案。
        </li>
        <li>
          size 控制错误和空状态的最小高度与间距；#empty 和 #error
          可替换整个状态区；#error 提供 error 和 retry 插槽参数。
        </li>
      </ul>
    </section>
  </ComponentPage>
</template>
