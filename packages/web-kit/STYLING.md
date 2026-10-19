# 样式扩展契约

## 使用规则

- 单节点组件用 `class` / `style`；有内部样式分区的组件另外提供类型化 `ui`。
- 合并顺序为 **内置默认值与变体 → `ui[分区]` → 主要节点的 `class`**。通过统一的 `mergeClasses`（Vue class 归一化 + Tailwind Merge）处理，冲突工具类后者优先，不重复追加 `$attrs.class`。
- `ui` 的值支持字符串、嵌套数组、条件对象和 falsy 值；区域名受各组件导出的 `X…Ui` 类型约束。
- 不同修饰符独立保留：`px-2` 不会删除 `sm:px-6`，需要同时覆盖时请显式提供 `px-2 sm:px-2`。自定义 CSS 类不会被展开为工具类；其覆盖遵循 CSS 层叠规则。
- `style`、ARIA 和事件继续转发至主要节点，不通过 `ui` 配置。浮层层级、抽屉尺寸及手势、全屏可见视口等运行时样式仍由对应行为逻辑管理，不属于工具类冲突合并。
- `ui` 只装饰组件实际渲染的区域，不创建新节点，也不修改调用方插槽内的元素。替换整个插槽时，插槽内容的样式由调用方负责。
- 本契约适用于公开的 `X…` UI 组件；应用布局和内部 Toast 渲染器不因此新增样式 API。

## 主要节点与公开分区

| 组件                                                                                                  | `class` / `style` 落点         | `ui` 分区                                                                                      |
| ----------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| XButton、XAspectRatio、XSeparator、XTabs 及其子组件、XDropdownMenuItem、XDropdownMenuSeparator、XTime | 自身根节点                     | 无；使用 `class`                                                                               |
| XSwitch                                                                                               | root                           | root、thumb                                                                                    |
| XSlider                                                                                               | root                           | root、track、range、thumb、tooltip、markTick、markLabel                                        |
| XScrollArea                                                                                           | root                           | root、viewport、scrollbar、thumb、corner                                                       |
| XDialog                                                                                               | Portal 内的 content            | content、overlay、header、title、description、body、footer、close、icon                        |
| XConfirmDialog                                                                                        | Portal 内的 content            | content、overlay、title、description、actions、cancel、confirm                                 |
| XDrawer                                                                                               | Portal 内的 content            | content、overlay、header、title、description、actions                                          |
| XSelect                                                                                               | trigger                        | trigger、value、icon、content、viewport、item、indicator、scrollbar、thumb                     |
| XDropdownMenu                                                                                         | Portal 内的 content            | content                                                                                        |
| XTooltip                                                                                              | Portal 内的 content            | content                                                                                        |
| XDropZone                                                                                             | 全屏 overlay                   | overlay、content、icon、description                                                            |
| XAsyncContent                                                                                         | 默认 display: contents 的 root | root、loading、spinner、error、empty、icon、title、description、retry                          |
| XPagination                                                                                           | 导航 root                      | root、list、prev、next、item、ellipsis、summary、jumpContent、jumpLabel、jumpInput、jumpButton |

XSlider 保留既有的属性分流：`class/style/id` 作用于 root，其余透传属性（包括 ARIA）作用于 thumb。XDropdownMenu 与 XTooltip 的 trigger 由插槽提供，触发器样式直接写在插槽元素上。

## 示例

```vue
<script setup lang="ts">
import { XDialog, XSelect, type XSelectUi } from '@novelia/web-kit';
import { ref } from 'vue';

const value = ref('one');
const open = ref(false);
const options = [{ label: '选项一', value: 'one' }];
const selectUi = {
  trigger: ['rounded-lg', { 'border-primary': true }],
  content: 'rounded-lg p-2',
  item: 'rounded-md h-11',
  viewport: 'max-h-80',
} as const satisfies XSelectUi;
</script>

<template>
  <!-- class 优先于 ui.trigger，两者都只作用于触发器。 -->
  <XSelect
    v-model="value"
    :options="options"
    :ui="selectUi"
    class="rounded-none"
  />

  <!-- 浮层宽度与内部正文样式分别配置。 -->
  <XDialog v-model:open="open" title="编辑" class="w-xl" :ui="{ body: 'p-0' }">
    自定义正文
  </XDialog>
</template>
```

## 破坏性迁移

| 旧写法                                   | 新写法                                                          |
| ---------------------------------------- | --------------------------------------------------------------- |
| XDialog `body-class="p-0"`               | `:ui="{ body: 'p-0' }"`                                         |
| XDropdownMenu `content-class="w-56"`     | `:ui="{ content: 'w-56' }"` 或 `class="w-56"`                   |
| XScrollArea `viewport-class="p-4"`       | `:ui="{ viewport: 'p-4' }"`                                     |
| XSlider `:ui="{ mark: 'text-primary' }"` | `:ui="{ markTick: 'text-primary', markLabel: 'text-primary' }"` |

旧属性不再声明或兼容。菜单统一使用 XDropdownMenu / XDropdownMenuItem，触发按钮和图标由调用方通过 `trigger` 插槽组合；菜单项使用 `destructive` 和 `select`。

## 实现新组件

1. 从共享工具导入 `mergeClasses`，用 `XUi<'区域名' | …>` 定义并导出组件 UI 类型。
2. 单节点组件不增加冗余 `ui.root`。复合组件只公开实际存在且有意义的区域。
3. 禁用自动 attrs 继承；主要节点显式转发 `{ ...$attrs, class: undefined }`，随后合并默认值、分区覆盖和 `$attrs.class`。有特殊 ARIA 处理的组件保留原有过滤逻辑。
4. 内部节点使用 `mergeClasses(defaults, conditionalClasses, ui.part)`；变体也可先通过 Tailwind Variants 计算，再交给同一合并函数。
5. 不在无层的组件 CSS 中写死可定制的视觉属性；必要的默认规则放在统一样式入口加载的 `components` 层，让 utilities 能正常覆盖。
6. 样式重构不得改变组件的受控状态、焦点、ARIA 或事件契约。
