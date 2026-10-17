# @novelia/web-kit

论坛前台共用的 Vue 组件库，提供登录、侧栏布局、账号菜单、主题切换、通知和处罚记录页。

## 接入

项目需要 Vue 3.5+、Vue Router 5.2+、Tailwind CSS 4.3+ 和 `@vicons/material`。

先在项目的样式入口引入：

```css
@import 'tailwindcss';
@import '@novelia/web-kit/styles.css';
```

在应用入口创建并安装：

```ts
import { createWebKit } from '@novelia/web-kit';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './style.css';

const webKit = createWebKit({
  auth: { app: 'f', url: '/auth' },
  brand: '论坛',
});

createApp(App).use(webKit).use(router).mount('#app');
```

`auth.app` 填认证服务中的应用标识，`auth.url` 填认证服务地址，`brand` 是侧栏显示的站点名。`createWebKit()` 只在入口调用一次，组件里用 `useWebKit()`。

## 布局和菜单

根组件用 `WebKitApp` 包一层，再用 `WebKitLayout` 放侧栏和页面内容：

```vue
<script setup lang="ts">
import {
  WebKitApp,
  WebKitLayout,
  type WebKitMenuOption,
} from '@novelia/web-kit';
import { HomeOutlined, PersonOutlined } from '@vicons/material';
import { useRoute } from 'vue-router';

const route = useRoute();
const navigationOptions: WebKitMenuOption[] = [
  { key: 'home', label: '首页', icon: HomeOutlined, to: '/' },
];
const accountOptions: WebKitMenuOption[] = [
  { key: 'profile', label: '个人资料', icon: PersonOutlined, to: '/profile' },
];
</script>

<template>
  <WebKitApp>
    <WebKitLayout
      :navigation-options="navigationOptions"
      :account-options="accountOptions"
      :selected-navigation-key="String(route.name ?? '')"
    >
      <RouterView />
    </WebKitLayout>
  </WebKitApp>
</template>
```

菜单的 `key` 保持唯一；上例用路由名匹配选中项。`icon` 可省略，也支持分割线、外链和分组：

```ts
const options: WebKitMenuOption[] = [
  { key: 'home', label: '首页', to: '/' },
  { type: 'divider', key: 'divider' },
  {
    type: 'external',
    key: 'docs',
    label: '文档',
    href: 'https://example.com/docs',
    target: '_blank',
  },
  {
    type: 'group',
    key: 'account',
    label: '账号',
    children: [{ key: 'settings', label: '设置', to: '/settings' }],
  },
];
```

布局会自动适配移动端，登录入口、主题切换和退出账号不用另接。正文使用窗口滚动，顶栏和桌面侧边栏通过 `sticky` 保持位置，长菜单在侧边栏内独立滚动；移动端导航使用 `fixed` 抽屉，仅打开时锁定背景滚动。页面需要滚回顶部时，直接调用 `window.scrollTo({ top: 0 })`；平滑滚动可添加 `behavior: 'smooth'`。

`WebKitLayout` 提供 `#header-actions` 插槽，仅在移动端（宽度不超过 767px）显示，位于顶栏账号按钮左侧，适合放置带 `aria-label` 的图标按钮：

```vue
<template #header-actions>
  <XButton size="icon" variant="toolbar" aria-label="搜索" @click="openSearch">
    <SearchOutlined class="size-5" aria-hidden="true" />
  </XButton>
</template>
```

## 视口判断

在组件的 `setup` / `<script setup>` 中调用，与 `WebKitLayout` 共用断点，不需要安装插件或位于布局内：

```ts
import { useWebKitViewport } from '@novelia/web-kit';

const { viewportMode, isMobile, isTablet, isDesktop } = useWebKitViewport();
```

返回值均为只读的响应式 ref，模板内自动解包，脚本内用 `.value`：

- `mobile`：宽度 ≤767px。
- `tablet`：宽度 768–1023px。
- `desktop`：宽度 ≥1024px。

挂载前（包括 SSR）默认为 `desktop`；挂载后读取媒体查询并随视口变化更新，卸载时自动移除监听器。此 API 判断的是窗口视口，不是页面内容区宽度，也不会修改调用侧 Tailwind 的响应式断点。

## 登录状态和请求

在组件中读取当前用户，或创建自动携带登录凭证的业务客户端：

```ts
import { useWebKit } from '@novelia/web-kit';

const { whoami, createClient, checkSignedIn, logout } = useWebKit();

const signedIn = await checkSignedIn();
const user = whoami.value.user;
const client = createClient('/api/', { timeout: 60_000 });
```

`whoami` 会随登录状态更新，也提供 `isAdmin`、`hasRoleAtLeast(role)` 和 `isAtLeastDaysOld(days)` 等权限判断。需要管理操作时，可从 `useWebKit()` 取得 `banUser`、`createStrike`。

## 通知和主题

```ts
import { Toast, useWebKit } from '@novelia/web-kit';

Toast.success('已保存');
Toast.error('保存失败');
Toast.info('有新的消息');
Toast.warning('请检查设置', { duration: 8000 });

const id = Toast.info('等待操作', {
  duration: 0, // 常驻，直到手动关闭
  onClose: () => console.log('已关闭'),
  onRemove: () => console.log('已移除'),
});
Toast.update(id, { message: '操作完成', status: 'success', duration: 3000 });
Toast.dismiss(id); // 只关闭这一条

// 成功时返回原操作的结果；失败时展示通知并返回 undefined，不再抛出原错误。
// 若成功操作本身返回 undefined，可先用 .then(() => true) 标记成功。
const result = await Toast.promise(
  client.post('settings', { json: settings }).json(),
  {
    loading: '正在保存…',
    success: '已保存',
    error: '保存失败',
  },
);
Toast.dismissAll();

const { theme } = useWebKit();
theme.setPreference('system'); // 也可设为 'light' 或 'dark'
theme.toggleTheme();
```

通知需要根组件中挂载 `WebKitApp`。`success` / `error` / `info` / `warning` 均返回消息 ID，并接受可选的 `ToastOptions`：`duration` 默认 4000 毫秒，`0` 或 `Infinity` 表示不自动关闭；`onClose` 在关闭时触发，`onRemove` 在退出动画结束、移除消息后触发。所有通知都有单独关闭按钮。可指定 `id`，重复添加同一条打开的消息会更新内容并重新计时；对已关闭的 ID 再次添加则开启新的生命周期。

`Toast.update(id, { message, status, duration, onClose, onRemove })` 仅修改提供的字段；设置 `duration: undefined` 可恢复默认时长，改变时长会重新计时，仅更新文案不重置计时。更新不存在或已关闭的消息会被忽略。`Toast.dismiss(id)` 单独关闭，`Toast.dismissAll()` 全部关闭。

`Toast.promise(promise, { loading, success, error }, options?)` 在同一条通知中展示加载、成功或失败状态；加载时不会自动关闭，完成后使用结果阶段或公共配置的时长（默认 4000 毫秒），不会继承加载阶段的常驻时长。各阶段均可选，接受字符串或 `{ message, duration?, onClose?, onRemove? }`，第三个参数提供公共 `ToastOptions`，阶段配置优先。例如 `success: { message: '已保存', duration: 2000 }`。整个消息参数也可省略。省略 `loading` 时等待 Promise 完成后才创建结果通知；省略 `success` 或 `error` 时不显示对应结果通知，并关闭已有的加载通知。错误阶段的 `message` 仍作为错误详情的前缀。手动关闭后，Promise 完成不会重新打开通知。主题默认跟随系统，会记住用户的选择。

Vite 项目可加上主题插件，避免首次打开时闪一下：

```ts
import { themeBootstrapPlugin } from '@novelia/web-kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [themeBootstrapPlugin()], // 加到现有插件列表中
});
```

### 阅读器等页面的临时主题

使用 `theme.setOverride()` 临时覆盖外观，不会改写 `theme.preference` 或 localStorage。`theme.theme` / `theme.isDark` 始终表示当前生效外观。覆盖的 `preference` 可为 `light`、`dark`、`system`，省略时沿用站点偏好。

```ts
// 在应用根部根据路由和阅读设置响应式更新；退出阅读路由时清除。
watch(
  () => [route.meta.isReader, readerSetting.value.theme] as const,
  ([isReader, readerTheme]) => {
    if (!isReader) {
      theme.clearOverride();
    } else if (readerTheme.mode === 'custom') {
      theme.setOverride({
        preference: isDarkColor(readerTheme.bodyColor) ? 'dark' : 'light',
        tokens: { '--color-body': readerTheme.bodyColor },
        themeColor: readerTheme.bodyColor,
      });
    } else {
      theme.setOverride({ preference: readerTheme.mode });
    }
  },
  { immediate: true, deep: true },
);
```

上例的 `route`、`readerSetting`、背景亮度判断 `isDarkColor()` 和 `watch` 由宿主提供。正文颜色单独绑定到阅读内容，不必覆盖全局 `--color-ink`，避免改变菜单和按钮文字。

- `setOverride()` **整体替换**上次覆盖，并复制参数；设置变动后需要重新调用。清除或替换时会恢复被移除 token 原有的根元素内联值（包括 `!important`）。
- token 写在根元素，因此 Portal 中的菜单、弹窗也能继承；这是单个全局覆盖层，不是嵌套主题 Provider。多个页面应由统一的路由级逻辑协调。
- `--color-body` 是布局背景；文档背景使用 `--color-surface`，无布局的阅读页面可按需同时覆盖它。不要默认把弹窗背景也改成阅读背景。
- 浏览器 `meta[name="theme-color"]` 若存在，依次使用 `themeColor`、覆盖的 `--color-body`、明暗基底默认色；清除后恢复默认色。使用 CSS 变量等非具体色值时，应显式传入具体的 `themeColor`。
- 覆盖期间 `setPreference()` / `toggleTheme()` 仍只修改持久化站点偏好，显式覆盖的明暗基底继续优先；清除后采用最新偏好，包括其他标签页同步的变更。
- `theme.override` 是当前覆盖的只读 Ref，未覆盖时为 `undefined`。组件管理覆盖时要在卸载时清除；使用 KeepAlive 时还需处理停用。主题 bootstrap 仅恢复站点偏好，不恢复临时覆盖。

## 处罚记录

账号菜单默认带有“处罚记录”入口，注册对应路由即可：

```ts
import { MyStrikeListView } from '@novelia/web-kit';

const routes = [
  { path: '/strikes', name: 'strikes', component: MyStrikeListView },
];
```

在 `createWebKit()` 的配置中设 `strikes: { enabled: false }` 可关闭入口，或用 `strikes: { to: '/my-strikes' }` 修改地址。

## 文件拖放

`XDropZone` 挂载后监听整个窗口，从系统拖入文件时显示全屏遮罩，拖离窗口、按 Escape、窗口失焦或放下文件后关闭。普通文本、链接和页面内拖拽不会触发。每个页面只需挂载一个实例，无需安装插件。

```vue
<script setup lang="ts">
import { XDropZone } from '@novelia/web-kit';

function handleDrop(files: File[], event: DragEvent) {
  // 自行校验、读取、上传或保存文件。
}
</script>

<template>
  <XDropZone :disabled="false" @drop="handleDrop">松开以导入文件</XDropZone>
</template>
```

`drop` 事件提供原始 `File[]` 和 `DragEvent`，不做类型、数量、大小校验，不读取文件或发起请求，也不保留文件列表。不支持目录递归读取或点击选择文件；需要时由调用方另外实现。默认插槽自定义提示文字，`#icon` 替换图标。`disabled` 默认为 `false`，设为 `true` 后立即关闭遮罩且不再拦截拖放（浏览器可能会直接打开拖入的文件）。卸载时自动清理监听器。

拖入计数和文件提取由 VueUse `useDropZone` 管理。当前 VueUse 14.4 在 Safari 会跳过拖入阶段的有效性判断：非文件拖拽不会显示遮罩，但可能被阻止浏览器默认行为；禁用组件后不受影响。

## 上传进度

`useUploadProgress(files)` 接收 `readonly File[]`，以文件对象为 Map 键、`file.size` 为初始总大小。仅初始化固定批次，不监听数组变化；同一对象去重，同名的不同文件独立管理。创建 composable 不会发送请求。

```ts
import { useUploadProgress } from '@novelia/web-kit';

// files 来自文件选择或拖放。
const uploads = useUploadProgress(files);
const controller = new AbortController();
const results = await Promise.allSettled(
  files.map((file) =>
    uploads.upload(file, {
      url: '/api/upload',
      signal: controller.signal,
    }),
  ),
);
// 上传期间 uploads.cancel(file) 真正中止单个请求；controller.abort() 取消整批。
// 成功结果的 value 是 Response，可调用 json()、text() 或 blob()。
```

对外仅提供 `uploads`、`isUploading`、`upload(file, options)` 和 `cancel(file)`：

- `uploads` 为响应式 `ReadonlyMap<File, UploadProgressItem>`，无需 `.value`。条目包含只读的 `status`（`idle / uploading / success / error / canceled`）、`isUploading`、`loaded`、`total`、`progress` 和 `error`。条目更新时整体替换，派生单文件状态可用 `computed(() => uploads.uploads.get(file))`。顶层 `isUploading` 是只读 Ref。
- `upload` 内部管理开始、进度和结果状态。未登记或已有活跃请求的文件直接拒绝；其他文件可并发。结束后再次调用即可重试，自动清理旧错误和进度，无需手动 reset。
- `cancel(file)` 真正中断请求并立即标记取消，可马上重试；取消空闲、已结束或未知文件不做处理。也支持请求选项的 `signal`。旧请求不会污染重试任务。卸载时需要取消的任务由调用方调用 `cancel` 或中止 signal。
- `loaded/total` 表示请求体传输字节数，FormData 可能包含额外开销。总大小未知时 `total/progress` 为 `null`。百分比范围 0–100，空文件初始为 0；达到 100% 不代表服务端确认成功，只有收到 2xx 响应才进入 `success`。

### 独立 XHR 上传

`uploadFile(file, options): Promise<Response>` 只负责请求，不依赖 Vue 或进度管理器。需要自定义状态管理时可直接使用：

```ts
import { uploadFile } from '@novelia/web-kit';

const response = await uploadFile(file, {
  url: signedUrl,
  method: 'PUT',
  bodyType: 'file',
  onProgress: ({ loaded, total }) => {
    // total 为 number | null，未知时可显示不定进度。
  },
});
const text = await response.text();
```

- 两种入口共用 `UploadRequestOptions`。默认 `POST` 和 `bodyType: 'form-data'`，文件字段默认 `file`；只有此模式可传 `fieldName`。不要手动设置 multipart 的 `Content-Type`，浏览器会补充 boundary。`bodyType: 'file'` 直接发送文件，适用于预签名 PUT。旧 `multipart` 参数已移除。
- 支持 `headers`、`timeout`（毫秒，默认 0 不限时）、`withCredentials`（默认 false）和 `signal`；不自动附加认证令牌、刷新令牌或重试。仅独立函数的 `UploadFileOptions` 额外提供 `onProgress` 回调。
- 响应统一返回标准 `Response`，读取 `status`、`headers`、`json()`、`text()` 或 `blob()`，不再暴露 XHR 或 `responseType`。响应由 XHR 数据构造，不包含 fetch 的 URL/重定向元数据。仅 2xx 视为成功，不判断业务状态。
- HTTP、网络和超时错误拒绝为 `UploadError`，含 `kind`（`http / network / timeout`）；仅 HTTP 错误含 `response`，可读取错误响应体。取消拒绝为 `AbortError`；配置、发送或进度回调异常保留原错误。所有结束路径清理事件监听。
- SSR 导入安全；实际上传需要浏览器 XHR。

## 其他组件

按钮、选择框、分页、菜单、提示框、确认框、时间显示和异步内容组件都可以从包入口按需导入，如 `XButton`、`XSelect`、`XPagination`、`XTooltip`、`XTime`。

在仓库根目录运行 `pnpm dev:web-kit`，打开输出的地址即可查看组件和主题示例，无需连接后端。
