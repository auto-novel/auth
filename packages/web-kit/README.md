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

`createWebKit` 在应用入口只调用一次；同一模块运行环境中再次调用会报错，不会覆盖配置或创建新会话。`auth.url` 可以是相对地址，按当前页面解析。

两个 kit 使用相同的生命周期契约：

- `createWebKit()` 只构造配置与内存状态，不读取会话/主题存储内容、不发请求、不注册监听器或定时器，也不修改页面主题。
- `webKit.start()` 启动认证会话、主题和处罚提醒。`app.use(webKit)` 会自动调用它，通常不需要手动启动；重复启动无副作用。
- `install` 提供上下文并注册 `app.onUnmount` 清理。一个 kit 只能安装到一个 Vue 应用，同一应用重复安装无副作用，跨应用安装会报错。不注册全局组件，组件仍要按需 import。
- `webKit.dispose()` 释放订阅、监听器、定时器及内存用户/提醒状态；已启动时还会清空通知，不清除持久化登录会话。未启动时也可释放，重复释放无副作用。

销毁是终态：之后不能启动或安装，也不重置单实例创建限制。同步启动或安装失败会清理已分配资源并销毁 kit，重新启动应用需要重载页面。
组件通过 `useWebKit()` 获取上下文，不取得 `start`、`install` 或 `dispose`；会话、主题和提醒的生命周期应统一由 kit 管理。

kit、组件/主题/提醒/布局上下文的对象外壳均被冻结，类型中的字段也只读，不能替换状态引用或方法。`profile` 的 Ref 与用户字段、提醒 `status` 均深只读，修改主题和提醒状态应调用公开方法。主题仅公开只读的 `theme`、`isDark` 和 `toggleTheme()`，不暴露内部生命周期。

配置是复制后冻结的快照，包括 `strikes.to` 的 params、query、state 及其中的数组/记录；修改传入的配置对象不会改变 kit，也不会冻结调用者的原对象。冻结上下文不会阻止 Ref 随内部状态更新；`api` 只禁止替换引用，其原有接口与调用能力不变。

创建后 `profile` 为 `undefined`，主题使用初始浅色，启动时才恢复存储状态。
`start()` 只启动同步，不等待网络登录检查；需要等待时，在启动后调用 `await webKit.api.checkSignedIn()`。
请先安装 kit 再安装 router，确保首次路由守卫使用已启动的会话；创建业务客户端仍可在启动前完成。

这里的单实例以浏览器中的包模块为边界，不支持 SSR 服务端按请求创建 kit，也不要在应用入口的热更新回调中重复创建。

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

`navigationOptions` 和 `accountOptions` 都支持三种注入项，每项的 `key` 需在对应菜单内唯一：

```ts
const options: WebKitMenuOption[] = [
  {
    type: 'link',
    key: 'profile',
    label: '个人资料',
    icon: PersonOutlined,
    to: '/profile',
  },
  { type: 'divider', key: 'divider' },
  {
    type: 'external',
    key: 'docs',
    label: '文档',
    icon: HomeOutlined,
    href: 'https://example.com/docs',
  },
];
```

- `link`：站内路由，`to` 是 `RouteLocationRaw`；省略 `type` 时仍按 `link` 处理，兼容原有配置。渲染成原生 `<a>`，右键、中键、Ctrl/Cmd 开新标签页都正常。
- `divider`：在该数据项的位置渲染分割线，不依赖 CSS 按位置推断。
- `external`：使用 `href`，在新标签页打开，文案末尾用图标组件显示小的外链标记。

内置菜单及注入位置不变：侧栏注入项在主题切换之前；账号注入项在账号信息及其分割线之后、处罚记录和退出账号之前。宿主只能在这些位置组织自己的菜单，不能通过注入配置重排内置项。

会话信息用 `useWebKit()` 拿：`{ api, profile, isSignedIn }`。

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

已启动的 kit 释放时也会清空通知。原来的 `useWebKit().notifications.notify` 改用 `Notify`，`notifications.dismissAll()` 改用 `Notify.dismissAll()`；不再导出 `Notifications` 类型或 `attentionKey`。`useAttention()` 保持不变，直接读取 kit 上同一份提醒状态。主题上下文只提供状态和 `toggleTheme()`，生命周期由 kit 管理。

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

主题在启动时写入 `<html data-theme>`，无已保存偏好时采用当时的系统主题，切换后写 `localStorage`（键默认 `<auth.app>-web-theme`，可用 `themeStorageKey` 覆盖）。侧边栏底部的按钮已经接好了，业务里要用就 `useWebTheme()`，拿 `{ isDark, theme, toggleTheme }`。

## 侧栏构建信息

上面 `createWebKit` 里的 `repository` 就是干这个的，配上之后桌面侧栏和移动端导航底部会显示 `SidebarFooter`。

`buildTime` 由应用的构建配置给 ISO 时间字符串，`commitSha` 给对应的 Git 提交哈希。页脚按浏览器本地时区显示时间，提交哈希截短到 12 位并链到仓库的提交页；哈希是 `unknown` 或空字符串就不生成链接，时间无效则显示“未知时间”。不配 `repository` 不显示页脚，侧栏收起时页脚隐藏且不进键盘焦点。
