<script setup lang="ts">
import {
  XDropdownMenu,
  XDropdownMenuItem,
  XButton,
  XConfirmDialog,
  XDialog,
  XDrawer,
  XSelect,
  XTooltip,
} from '@novelia/web-kit';
import { computed, ref } from 'vue';
import ComponentPage from './ComponentPage.vue';

type DrawerSide = 'left' | 'right' | 'top' | 'bottom';

const open = ref(false);
const externalOpen = ref(false);
const headerOpen = ref(false);
const actionOpen = ref(false);
const customHeaderOpen = ref(false);
const layerDrawerOpen = ref(false);
const layerDialogOpen = ref(false);
const layerConfirmOpen = ref(false);
const innerDrawerOpen = ref(false);
const layerSelection = ref('one');
const layerOptions = [
  { label: '选项一', value: 'one' },
  { label: '选项二', value: 'two' },
];
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
    :size="360"
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
  <XDrawer v-model:open="open" title="外部控制抽屉" side="bottom" :size="320">
    <div class="min-h-0 flex-1 overflow-y-auto p-6">
      <h2 class="mb-4 text-lg font-medium">外部控制抽屉</h2>
      <XButton @click="open = false">关闭</XButton>
    </div>
  </XDrawer>
</template>`;

const headerCode = `<XDrawer v-model:open="open" title="编辑资料" show-header :size="360">
  <template #trigger>
    <XButton variant="outline">编辑资料</XButton>
  </template>
  <!-- 不传 action 时，仅显示 title。 -->
  <template #action>
    <XButton variant="ghost" size="sm" @click="open = false">关闭</XButton>
  </template>
  <div class="min-h-0 flex-1 overflow-y-auto p-6">表单内容</div>
</XDrawer>`;

const customHeaderCode = `<XDrawer v-model:open="open" title="筛选条件" :size="360">
  <template #trigger>
    <XButton variant="outline">筛选条件</XButton>
  </template>
  <!-- header 替换整个标题栏内容，不会再渲染默认 title 或 action。 -->
  <template #header>
    <div>
      <h2 class="text-lg font-medium">筛选条件</h2>
      <p class="text-xs text-muted">仅查看符合条件的结果</p>
    </div>
    <XButton variant="ghost" size="sm" @click="open = false">关闭</XButton>
  </template>
  <div class="min-h-0 flex-1 overflow-y-auto p-6">筛选内容</div>
</XDrawer>`;

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
    description:
      '无障碍标题；showHeader 开启时显示在默认标题栏中，关闭或使用 #header 时以 sr-only 渲染。',
  },
  {
    name: 'showHeader',
    type: 'boolean',
    default: 'false',
    description:
      '显示默认标题栏；#action 添加操作区，#header 自动显示自定义标题栏。',
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
    name: 'size',
    type: 'number | string',
    default: '280',
    description:
      '左右抽屉宽度或上下抽屉高度；数字单位为 px，字符串可传 CSS 长度。',
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
        选择方向后通过 trigger 插槽按钮打开。size
        控制左右方向的宽度或上下方向的高度；本例数字单位为 px，空值回退到
        360，最小为 120。
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
          :size="side === 'left' || side === 'right' ? panelWidth : panelHeight"
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
        :size="320"
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
      aria-labelledby="drawer-header"
      class="border-t border-divider pt-6"
    >
      <h2 id="drawer-header" class="mb-2 font-medium">标题栏与操作区</h2>
      <p class="mb-4 text-sm text-muted">
        showHeader 默认关闭，上方示例自行放置可见标题。开启后默认显示 title；
        action 插槽添加右侧操作区，header
        插槽替换整个标题栏内容（包括默认操作区）。
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <XDrawer
          v-model:open="headerOpen"
          title="默认标题栏"
          show-header
          :size="360"
        >
          <template #trigger>
            <XButton variant="outline">默认标题栏</XButton>
          </template>
          <div class="min-h-0 flex-1 overflow-y-auto p-6">
            <p class="mb-4 text-sm text-muted">
              标题由 title 提供，内容区无需重复添加标题。
            </p>
            <XButton @click="headerOpen = false">关闭</XButton>
          </div>
        </XDrawer>
        <XDrawer
          v-model:open="actionOpen"
          title="编辑资料"
          show-header
          :size="360"
        >
          <template #trigger>
            <XButton variant="outline">标题栏操作区</XButton>
          </template>
          <template #action>
            <XButton variant="ghost" size="sm" @click="actionOpen = false">
              关闭
            </XButton>
          </template>
          <div class="min-h-0 flex-1 overflow-y-auto p-6">
            <label class="flex flex-col gap-2 text-sm">
              名称
              <input
                class="rounded-sm border border-border bg-surface p-2 text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
                placeholder="通过标题栏按钮关闭"
              />
            </label>
          </div>
        </XDrawer>
        <XDrawer v-model:open="customHeaderOpen" title="筛选条件" :size="360">
          <template #trigger>
            <XButton variant="outline">自定义标题栏</XButton>
          </template>
          <template #header>
            <div>
              <h2 class="text-lg font-medium">筛选条件</h2>
              <p class="text-xs text-muted">仅查看符合条件的结果</p>
            </div>
            <XButton
              variant="ghost"
              size="sm"
              @click="customHeaderOpen = false"
            >
              关闭
            </XButton>
          </template>
          <div class="min-h-0 flex-1 overflow-y-auto p-6">
            <p class="text-sm text-muted">
              自定义标题栏可以组合标题、副标题和按钮。title
              仍为抽屉提供隐藏的无障碍标题。
            </p>
          </div>
        </XDrawer>
      </div>
    </section>

    <section
      aria-labelledby="drawer-layers"
      class="border-t border-divider pt-6"
    >
      <h2 id="drawer-layers" class="mb-2 font-medium">嵌套弹层与浮层层级</h2>
      <p class="mb-4 text-sm text-muted">
        抽屉中打开
        Dialog，再打开确认框或另一层抽屉。检查遮罩覆盖、下拉框、菜单、
        Tooltip、Esc 逐层关闭和焦点恢复；关闭动画结束后再重新打开。
        当前不保证退出动画中交错重开的 Popper 层级、交互栈与焦点顺序同步。
      </p>
      <!-- 提前声明确认框，验证层级不依赖组件或 Portal 的声明顺序。 -->
      <XConfirmDialog
        v-model:open="layerConfirmOpen"
        @confirm="layerConfirmOpen = false"
        title="确认操作"
        description="确认框的遮罩应覆盖之前打开的抽屉和 Dialog。"
      />
      <XDrawer
        v-model:open="layerDrawerOpen"
        title="第一层抽屉"
        show-header
        :size="360"
      >
        <template #trigger>
          <XButton variant="outline">检查嵌套弹层</XButton>
        </template>
        <div class="space-y-4 p-6">
          <XSelect
            v-model="layerSelection"
            :options="layerOptions"
            aria-label="抽屉内选项"
          />
          <XDialog v-model:open="layerDialogOpen" title="抽屉中的 Dialog">
            <template #trigger>
              <XButton>打开 Dialog</XButton>
            </template>
            <div class="space-y-4 pr-8">
              <XSelect
                v-model="layerSelection"
                :options="layerOptions"
                aria-label="Dialog 内选项"
              />
              <div class="flex flex-wrap items-center gap-3">
                <XButton variant="outline" @click="layerConfirmOpen = true">
                  打开确认框
                </XButton>
                <XDropdownMenu>
                  <template #trigger>
                    <XButton variant="ghost">更多操作</XButton>
                  </template>
                  <XDropdownMenuItem @select="layerConfirmOpen = true">
                    从菜单确认
                  </XDropdownMenuItem>
                </XDropdownMenu>
                <XTooltip>
                  <template #trigger>
                    <XButton variant="ghost">提示</XButton>
                  </template>
                  提示应显示在 Dialog 上方
                </XTooltip>
                <XDrawer
                  v-model:open="innerDrawerOpen"
                  title="Dialog 中的抽屉"
                  show-header
                  :size="320"
                >
                  <template #trigger>
                    <XButton variant="outline">再开抽屉</XButton>
                  </template>
                  <div class="space-y-4 p-6">
                    <p class="text-sm text-muted">反向嵌套也应位于最上方。</p>
                    <XButton @click="layerConfirmOpen = true">
                      打开确认框
                    </XButton>
                    <XButton variant="outline" @click="innerDrawerOpen = false">
                      关闭本层抽屉
                    </XButton>
                  </div>
                </XDrawer>
              </div>
              <XButton variant="outline" @click="layerDialogOpen = false">
                关闭 Dialog
              </XButton>
            </div>
          </XDialog>
          <XButton variant="outline" @click="layerDrawerOpen = false">
            关闭第一层抽屉
          </XButton>
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
          抽屉内容，无插槽参数。自行放置表单、滚动容器及关闭按钮；未开启
          showHeader 时可自行添加可见标题。
        </dd>
        <dt><code>#action</code></dt>
        <dd class="text-muted">
          默认标题栏右侧操作区，无插槽参数。仅在 showHeader 开启且未提供 #header
          时显示，可放置关闭或保存按钮。
        </dd>
        <dt><code>#header</code></dt>
        <dd class="text-muted">
          替换整个标题栏内容，无插槽参数。提供后自动显示，无需开启 showHeader。
          保留标题栏容器的布局、内边距和分隔线；title 仍作为隐藏的无障碍标题。
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
      <h3 class="mb-2 mt-6 text-sm font-medium">默认标题栏与 action 操作区</h3>
      <pre
        class="overflow-x-auto rounded-sm border border-border bg-surface p-4 text-xs leading-6 text-ink"
      ><code>{{ headerCode }}</code></pre>
      <h3 class="mb-2 mt-6 text-sm font-medium">header 自定义标题栏</h3>
      <pre
        class="overflow-x-auto rounded-sm border border-border bg-surface p-4 text-xs leading-6 text-ink"
      ><code>{{ customHeaderCode }}</code></pre>
    </section>
  </ComponentPage>
</template>
