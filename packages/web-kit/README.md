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

// 返回原操作的结果；失败时仍会抛出原错误，调用方需要处理。
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

通知需要根组件中挂载 `WebKitApp`。`Toast.promise(promise, { loading, success, error })` 在同一条通知中展示加载、成功或失败状态；加载时不会自动关闭，完成后恢复默认时长。`loading` / `success` / `error` 仅接受字符串，内部统一使用固定的状态和消息格式。手动关闭后，Promise 完成不会重新打开通知。主题默认跟随系统，会记住用户的选择。

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

## 其他组件

按钮、选择框、分页、菜单、提示框、确认框、时间显示和异步内容组件都可以从包入口按需导入，如 `XButton`、`XSelect`、`XPagination`、`XTooltip`、`XTime`。

在仓库根目录运行 `pnpm dev:web-kit`，打开输出的地址即可查看组件和主题示例，无需连接后端。
