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
    type: 'external', key: 'docs', label: '文档',
    href: 'https://example.com/docs', target: '_blank',
  },
  {
    type: 'group', key: 'account', label: '账号',
    children: [{ key: 'settings', label: '设置', to: '/settings' }],
  },
];
```

布局会自动适配移动端，登录入口、主题切换和退出账号不用另接。页面需要滚回顶部时，调用 `useWebKitLayout().scrollToTop()`。

`WebKitLayout` 提供 `#header-actions` 插槽，仅在移动端（宽度不超过 767px）显示，位于顶栏账号按钮左侧，适合放置带 `aria-label` 的图标按钮：

```vue
<template #header-actions>
  <XButton size="icon" variant="toolbar" aria-label="搜索" @click="openSearch">
    <SearchOutlined class="size-5" aria-hidden="true" />
  </XButton>
</template>
```

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
import { Notify, useWebKit } from '@novelia/web-kit';

Notify.success('已保存');
Notify.error('保存失败');

const { theme } = useWebKit();
theme.setPreference('system'); // 也可设为 'light' 或 'dark'
theme.toggleTheme();
```

通知需要根组件中挂载 `WebKitApp`。主题默认跟随系统，会记住用户的选择。

Vite 项目可加上主题插件，避免首次打开时闪一下：

```ts
import { themeBootstrapPlugin } from '@novelia/web-kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [themeBootstrapPlugin()], // 加到现有插件列表中
});
```

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
