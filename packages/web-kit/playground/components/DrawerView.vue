<script setup lang="ts">
import { XButton, XDrawer, XSelect } from '@novelia/web-kit';
import { computed, ref } from 'vue';
import ComponentPage from './ComponentPage.vue';

type DrawerSide = 'left' | 'right' | 'top' | 'bottom';

const open = ref(false);
const externalOpen = ref(false);
const side = ref<DrawerSide>('right');
const width = ref<number | string>(360);
const height = ref<number | string>(360);
const panelWidth = computed(() => Math.max(120, Number(width.value) || 360));
const panelHeight = computed(() => Math.max(120, Number(height.value) || 360));
const sideOptions = [
  { label: '左侧 · left', value: 'left' },
  { label: '右侧 · right', value: 'right' },
  { label: '顶部 · top', value: 'top' },
  { label: '底部 · bottom', value: 'bottom' },
];

function setSide(value: string) {
  if (
    value === 'left' ||
    value === 'right' ||
    value === 'top' ||
    value === 'bottom'
  ) {
    side.value = value;
  }
}

const triggerCode = `<script setup lang="ts">
import { ref } from 'vue';
import { XButton, XDrawer } from '@novelia/web-kit';

const open = ref(false);
<\/script>

<template>
  <XDrawer
    v-model:open="open"
    title="编辑资料"
    description="在抽屉中填写资料。"
    side="right"
    :width="360"
    :height="360"
  >
    <template #trigger>
      <XButton variant="outline">编辑资料</XButton>
    </template>
    <div class="min-h-0 flex-1 overflow-y-auto p-6">
      <h2 class="mb-4 text-lg font-medium">编辑资料</h2>
      <label class="mb-6 flex flex-col gap-2 text-sm">
        名称
        <input class="rounded-sm border border-border bg-surface p-2" />
      </label>
      <XButton @click="open = false">完成并关闭</XButton>
    </div>
  </XDrawer>
</template>`;

const externalCode = `<script setup lang="ts">
import { ref } from 'vue';
import { XButton, XDrawer } from '@novelia/web-kit';

const open = ref(false);
<\/script>

<template>
  <XButton @click="open = true">从外部打开</XButton>
  <XDrawer v-model:open="open" title="外部控制抽屉" side="bottom" :height="320">
    <div class="min-h-0 flex-1 overflow-y-auto p-6">
      <h2 class="mb-4 text-lg font-medium">外部控制抽屉</h2>
      <XButton @click="open = false">关闭</XButton>
    </div>
  </XDrawer>
</template>`;

const props = [
  {
    name: 'open',
    type: 'boolean',
    default: '必填',
    description: '受控展开状态，通过 v-model:open 同步。',
  },
  {
    name: 'title',
    type: 'string',
    default: '必填',
    description: '无障碍标题，组件仅以 sr-only 渲染；可见标题需自行添加。',
  },
  {
    name: 'description',
    type: 'string',
    default: '未设置',
    description: '可选无障碍描述，同样不作为可见内容显示。',
  },
  {
    name: 'side',
    type: "'left' | 'right' | 'top' | 'bottom'",
    default: "'right'",
    description: '抽屉进入方向。',
  },
  {
    name: 'width',
    type: 'number | string',
    default: '280',
    description:
      '仅左右抽屉生效；数字单位为 px，字符串可传 CSS 长度。窄屏自动限制最大宽度。',
  },
  {
    name: 'height',
    type: 'number | string',
    default: '280',
    description:
      '仅上下抽屉生效；数字单位为 px，字符串可传 CSS 长度。自动限制最大高度。',
  },
];
</script>

<template>
  <ComponentPage
    title="抽屉 · XDrawer"
    description="从屏幕边缘滑入的模态面板，适合表单、筛选条件和辅助导航。支持四个方向、受控展开状态和自定义内容。"
  >
    <section aria-labelledby="drawer-directions">
      <h2 id="drawer-directions" class="mb-2 font-medium">四方向与尺寸</h2>
      <p class="mb-4 text-sm text-muted">
        选择方向后通过 trigger 插槽按钮打开。左右方向使用 width，上下方向使用
        height；本例数字单位为 px，空值回退到 360，最小为 120。
      </p>
      <div
        class="flex flex-wrap items-end gap-4 rounded-sm border border-border p-4"
      >
        <div class="flex w-48 flex-col gap-2 text-sm">
          <label for="drawer-side">方向</label>
          <XSelect
            id="drawer-side"
            :model-value="side"
            :options="sideOptions"
            aria-label="抽屉方向"
            @update:model-value="setSide"
          />
        </div>
        <label class="flex w-36 flex-col gap-2 text-sm">
          width（px）
          <input
            v-model.number="width"
            type="number"
            min="120"
            step="20"
            class="min-h-10 rounded-sm border border-border bg-surface px-3 text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
          />
        </label>
        <label class="flex w-36 flex-col gap-2 text-sm">
          height（px）
          <input
            v-model.number="height"
            type="number"
            min="120"
            step="20"
            class="min-h-10 rounded-sm border border-border bg-surface px-3 text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
          />
        </label>
        <XDrawer
          v-model:open="open"
          title="四方向抽屉示例"
          description="可以输入内容并通过按钮关闭抽屉。"
          :side="side"
          :width="panelWidth"
          :height="panelHeight"
        >
          <template #trigger>
            <XButton variant="outline">打开抽屉 · {{ side }}</XButton>
          </template>
          <div class="min-h-0 flex-1 overflow-y-auto p-6">
            <h3 class="text-lg font-medium">四方向抽屉示例</h3>
            <p class="my-4 text-sm text-muted">
              当前方向：{{ side }}。可用 Tab 检查焦点约束，使用遮罩、Esc
              或向边缘拖动关闭。
            </p>
            <label class="mb-6 flex flex-col gap-2 text-sm">
              示例输入框
              <input
                class="rounded-sm border border-border bg-surface p-2 text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
                placeholder="检查键盘焦点"
              />
            </label>
            <XButton @click="open = false">完成并关闭</XButton>
          </div>
        </XDrawer>
      </div>
      <p class="mt-3 text-xs text-muted">
        open：{{ open }} · width：{{ panelWidth }}px · height：{{
          panelHeight
        }}px。 关闭后检查焦点是否返回打开按钮，打开时检查背景滚动锁定。
      </p>
    </section>

    <section
      aria-labelledby="drawer-external"
      class="border-t border-divider pt-6"
    >
      <h2 id="drawer-external" class="mb-2 font-medium">
        外部按钮打开 · 无 trigger
      </h2>
      <p class="mb-4 text-sm text-muted">
        trigger 插槽是可选的。外部按钮直接设置 open =
        true；关闭仍由受控状态驱动，可检查焦点恢复到此按钮。
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <XButton variant="outline" @click="externalOpen = true">
          从外部打开
        </XButton>
        <span class="text-xs text-muted">externalOpen：{{ externalOpen }}</span>
      </div>
      <XDrawer
        v-model:open="externalOpen"
        title="外部控制抽屉"
        description="此示例不提供 trigger 插槽。"
        side="bottom"
        :height="320"
      >
        <div class="min-h-0 flex-1 overflow-y-auto p-6">
          <h3 class="text-lg font-medium">外部控制抽屉</h3>
          <p class="my-4 text-sm text-muted">
            没有 trigger 插槽，也可以通过 v-model:open 打开。
          </p>
          <label class="mb-6 flex flex-col gap-2 text-sm">
            示例输入框
            <input
              class="rounded-sm border border-border bg-surface p-2 text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
              placeholder="输入内容后关闭"
            />
          </label>
          <XButton @click="externalOpen = false">关闭外部控制抽屉</XButton>
        </div>
      </XDrawer>
    </section>

    <section
      aria-labelledby="drawer-props"
      class="border-t border-divider pt-6"
    >
      <h2 id="drawer-props" class="mb-4 font-medium">Props</h2>
      <div class="overflow-x-auto rounded-sm border border-border">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-divider bg-surface">
            <tr>
              <th scope="col" class="px-4 py-3 font-medium">属性</th>
              <th scope="col" class="px-4 py-3 font-medium">类型</th>
              <th scope="col" class="px-4 py-3 font-medium">默认值</th>
              <th scope="col" class="px-4 py-3 font-medium">说明</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-divider">
            <tr v-for="prop in props" :key="prop.name">
              <td class="px-4 py-3">
                <code>{{ prop.name }}</code>
              </td>
              <td class="px-4 py-3">
                <code class="text-xs">{{ prop.type }}</code>
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                <code>{{ prop.default }}</code>
              </td>
              <td class="min-w-64 px-4 py-3 text-muted">
                {{ prop.description }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section aria-labelledby="drawer-api" class="border-t border-divider pt-6">
      <h2 id="drawer-api" class="mb-4 font-medium">插槽与受控 open API</h2>
      <dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
        <dt><code>#trigger</code></dt>
        <dd class="text-muted">
          可选打开触发器，使用 as-child；建议放置单个 XButton 或可聚焦按钮。
        </dd>
        <dt><code>#default</code></dt>
        <dd class="text-muted">
          抽屉内容，无插槽参数。自行放置可见标题、表单、滚动容器及关闭按钮。
        </dd>
        <dt><code>v-model:open</code></dt>
        <dd class="text-muted">
          等价于 :open 与 @update:open。trigger、遮罩、Esc
          和拖动关闭产生的状态变化通过 update:open 同步给调用方。
        </dd>
        <dt><code>open = false</code></dt>
        <dd class="text-muted">
          内容按钮直接修改绑定状态即可关闭；没有 close API，不提供 close
          方法、close 事件或 close 插槽。
        </dd>
      </dl>
    </section>

    <section aria-labelledby="drawer-code" class="border-t border-divider pt-6">
      <h2 id="drawer-code" class="mb-4 font-medium">Vue 用法</h2>
      <h3 class="mb-2 text-sm font-medium">trigger 插槽与自定义内容</h3>
      <pre
        class="overflow-x-auto rounded-sm border border-border bg-surface p-4 text-xs leading-6 text-ink"
      ><code>{{ triggerCode }}</code></pre>
      <h3 class="mb-2 mt-6 text-sm font-medium">外部控制，不传 trigger</h3>
      <pre
        class="overflow-x-auto rounded-sm border border-border bg-surface p-4 text-xs leading-6 text-ink"
      ><code>{{ externalCode }}</code></pre>
    </section>
  </ComponentPage>
</template>
