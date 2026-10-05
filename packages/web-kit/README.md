# @novelia/web-kit

论坛前台共用的 Vue 组件库：认证会话、响应式布局、侧边栏、账号菜单、主题切换、全局通知和处罚记录页。

## 依赖

以下包需要宿主自己装：`vue` `^3.5.41`、`vue-router` `^5.2.0`、`@vicons/material` `^0.13.0`、`tailwindcss` `^4.3.3`。

## 样式

web-kit 的样式不会自动注入，宿主的 Tailwind 入口要引一下，放在 `tailwindcss` 后面：

```css
@import 'tailwindcss';
@import '@novelia/web-kit/styles.css';
```

这里面有主题变量、自定义工具类和 `@source`，Tailwind 会据此扫描 web-kit 的源码，不用再手动配 content。漏掉这步组件会没样式，通知最容易看出来。

## 使用

```ts
// src/main.ts
import { createWebKit } from '@novelia/web-kit';

const webKit = createWebKit({
  auth: { app: 'f', url: '/auth' },
  brand: '论坛',
  repository: {
    url: 'https://github.com/auto-novel/forum',
    buildTime: __BUILD_TIME__,
    commitSha: __COMMIT_SHA__,
  },
});

createApp(App).use(webKit).use(router).mount('#app');
```

`createWebKit` 在应用入口只调用一次；同一模块运行环境中再次调用会报错，不会覆盖配置或创建新会话。kit 只安装到一个 Vue 应用，同一应用重复安装无副作用，跨应用安装会报错。组件通过 `useWebKit()` 读取上下文，不取得 `install`/`dispose`。

`auth.url` 可以是相对地址，按当前页面解析。创建 kit 时认证会话已经开始检查登录并注册监听器/刷新定时器；`app.use(webKit)` 提供上下文、启动主题与处罚提醒，并注册卸载清理，不注册全局组件。组件仍要按需 import，router 在 mount 前安装即可。

Vue 应用卸载时会自动调用 `webKit.dispose()`；创建后没有安装的 kit 也必须手动释放。重复释放无副作用，释放后不能重新安装或再次创建，重新启动应用应重载页面。这里的单实例以浏览器中的包模块为边界，不支持 SSR 服务端按请求创建 kit，也不要在应用入口的热更新回调中重复创建。

根组件用 `WebKitApp` 包一层，它负责挂载全局通知：

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { HomeOutlined, PersonOutlined } from '@vicons/material';
import {
  WebKitApp,
  WebKitLayout,
  type WebKitMenuOption,
} from '@novelia/web-kit';
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

`WebKitApp` 默认渲染 `<RouterView />`，也可以用默认插槽自己写。`Notify` 只在 `WebKitApp` 挂载后才有地方显示，脱离它调用不报错，但什么也看不到；老代码里的通知原来挂在 `WebKitLayout` 上，升级时把 `WebKitApp` 补上就行。

菜单项的 `to` 是 `RouteLocationRaw`，渲染成原生 `<a>`，右键、中键、Ctrl/Cmd 开新标签页都正常。会话信息用 `useWebKit()` 拿：`{ api, profile, isSignedIn }`。

页面内容区要滚回顶部时用 `useWebKitLayout().scrollToTop()`，别自己去查 DOM；不在布局里它会退化成滚动窗口。

## 处罚记录

账号菜单里有个内置的“处罚记录”入口，默认指向 `/strikes`，宿主注册这个路由即可：

```ts
import { MyStrikeListView } from '@novelia/web-kit';

{ path: '/strikes', name: 'strikes', component: MyStrikeListView }
```

页面用 `?page=` 分页，未登录会提示登录。不需要这个入口或者想换路径：

```ts
createWebKit({ /* ... */ strikes: { enabled: false } });
createWebKit({ /* ... */ strikes: { to: { name: 'strikes' } } });
```

关掉入口时，账号按钮上的未读红点也一起关掉。

未读状态和账号按钮同源，想在别处用（比如自己画一个角标）：

```ts
import { useAttention } from '@novelia/web-kit';

const { status, refresh } = useAttention();

status.value?.strikes.hasUnread;
```

## 通知

```ts
import { Notify } from '@novelia/web-kit';

Notify.success('已保存');
Notify.error('保存失败');
```

`Notify` 直接写入唯一的应用级队列，不依赖 kit 的创建顺序，也没有“当前实例”切换。全应用只挂载一个 `WebKitApp`；挂载前的通知会保留在队列中，挂载后显示。需要手动清空时：

```ts
Notify.dismissAll();
```

kit 释放时也会清空通知。原来的 `useWebKit().notifications.notify` 改用 `Notify`，`notifications.dismissAll()` 改用 `Notify.dismissAll()`；不再导出 `Notifications` 类型或 `attentionKey`。`useAttention()` 保持不变，直接读取 kit 上同一份提醒状态。主题上下文只提供状态和 `toggleTheme()`，生命周期由 kit 管理。

## 错误文案

自己的请求可以复用同一套解析（认得 ky 抛出的错误，会依次尝试 `message`、`error`、`detail`，再退到响应正文）：

```ts
import { getApiErrorMessage, Notify } from '@novelia/web-kit';

try {
  await save();
} catch (reason) {
  Notify.error(await getApiErrorMessage(reason, '保存失败'));
}
```

## 主题

主题记在 `<html data-theme>` 上，默认跟随系统，切换后写 `localStorage`（键默认 `<auth.app>-web-theme`，可用 `themeStorageKey` 覆盖）。侧边栏底部的按钮已经接好了，业务里要用就 `useWebTheme()`，拿 `{ isDark, theme, toggleTheme }`。

## 侧栏构建信息

上面 `createWebKit` 里的 `repository` 就是干这个的，配上之后桌面侧栏和移动端导航底部会显示 `SidebarFooter`。

`buildTime` 由应用的构建配置给 ISO 时间字符串，`commitSha` 给对应的 Git 提交哈希。页脚按浏览器本地时区显示时间，提交哈希截短到 12 位并链到仓库的提交页；哈希是 `unknown` 或空字符串就不生成链接，时间无效则显示“未知时间”。不配 `repository` 不显示页脚，侧栏收起时页脚隐藏且不进键盘焦点。
