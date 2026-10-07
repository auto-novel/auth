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

web-kit 的生命周期契约：

- `createWebKit()` 只构造配置与内存状态，不读取会话/主题存储内容、不发请求、不注册监听器或定时器，也不修改页面主题。
- `webKit.start()` 启动认证会话、主题和处罚提醒。`app.use(webKit)` 会自动调用它，通常不需要手动启动；重复启动无副作用。
- `install` 提供上下文并注册 `app.onUnmount` 清理。一个 kit 只能安装到一个 Vue 应用，同一应用重复安装无副作用，跨应用安装会报错。不注册全局组件，组件仍要按需 import。
- `webKit.dispose()` 释放订阅、监听器、定时器及内存用户/提醒状态；已启动时还会清空通知，不清除持久化登录会话。未启动时也可释放，重复释放无副作用。

销毁是终态：之后不能启动或安装，也不重置单实例创建限制。同步启动或安装失败会清理已分配资源并销毁 kit，重新启动应用需要重载页面。
组件通过 `useWebKit()` 获取上下文，不取得 `start`、`install` 或 `dispose`；会话、主题和提醒的生命周期应统一由 kit 管理。

kit、组件/主题/提醒/布局上下文的对象外壳均被冻结，类型中的字段也只读，不能替换状态引用或方法。`whoami` 中的用户字段、提醒 `status` 均深只读，修改主题和提醒状态应调用公开方法。主题仅公开只读的 `theme`、`isDark` 和 `toggleTheme()`，不暴露内部生命周期。

配置是复制后冻结的快照，包括 `strikes.to` 的 params、query、state 及其中的数组/记录；修改传入的配置对象不会改变 kit，也不会冻结调用者的原对象。冻结上下文不会阻止 Ref 随内部状态更新；`api` 的对象外壳也被冻结，仅暴露宿主需要的业务方法。

创建后 `whoami` 处于未登录状态，主题使用初始浅色，启动时才恢复存储状态。
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

`navigationOptions` 和 `accountOptions` 都支持四种注入项，每项的 `key` 需在对应菜单内唯一（包括分组中的子项）。`icon` 可省略，未设置时仍保留图标位置，保持文字对齐：

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
  {
    type: 'group',
    key: 'account',
    label: '账号',
    icon: PersonOutlined,
    children: [
      { key: 'settings', label: '设置', icon: PersonOutlined, to: '/settings' },
    ],
  },
];
```

- `link`：站内路由，`to` 是 `RouteLocationRaw`；省略 `type` 时仍按 `link` 处理，兼容原有配置。渲染成原生 `<a>`，右键、中键、Ctrl/Cmd 开新标签页都正常。
- `divider`：在该数据项的位置渲染分割线，不依赖 CSS 按位置推断。
- `external`：使用 `href`，默认在当前页面打开；设置 `target: '_blank'` 时在新标签页打开，并显示新标签页图标和无障碍提示。
- `group`：使用 `children` 配置子项，支持嵌套。侧栏中点击分组可向下展开或收起，子项与一级菜单对齐，不额外缩进；选中子项时自动展开其父级；侧栏收窄后仍可点击图标展开子项。展开状态在布局存活期间保留，关闭移动端抽屉或收起父分组不会清空子分组状态。账号菜单中以子菜单展开，支持键盘操作。

内置菜单及注入位置不变：侧栏注入项在主题切换之前；账号注入项在账号信息及其分割线之后、处罚记录和退出账号之前。宿主只能在这些位置组织自己的菜单，不能通过注入配置重排内置项。

会话信息用 `useWebKit()` 拿：`{ api, whoami }`。`whoami` 是 `ComputedRef<Whoami>`，含 `user`、`isSignedIn`、`isAdmin`、`asAdmin`、`roleLabel`，以及 `hasRoleAtLeast(role)`、`isAtLeastDaysOld(days)` 两个判定方法；站点自己的准入策略（如注册满 30 天）在宿主里用这两者组合，不要塞进 kit。`whoami.user` 的公开类型为只读的 `WhoamiUser`，其 `createdAt` 使用 Unix 毫秒时间戳，在 JWT 解析时转换，可直接给 `XTime` 或 `Date`，不要再 `* 1000`。用户状态与权限判定统一通过 `whoami` 获取，账号年龄使用 `whoami.isAtLeastDaysOld(days)` 判断。

页面内容区要滚回顶部时用 `useWebKitLayout().scrollToTop()`，别自己去查 DOM；不在布局里它会退化成滚动窗口。

## 认证 API

认证会话由 `createWebKit()` 统一创建和管理。角色工具和类型可从包主入口导入。已安装 kit 的应用通过 `useWebKit().api` 复用会话，其类型为 `WebKitApi`，仅提供：

- `createClient(baseUrl, options?)`：创建携带当前会话的业务客户端。
- `checkSignedIn()`：等待登录检查并返回登录状态。
- `logout()`：退出当前账号。
- `banUser(request)`、`createStrike(request)`：宿主管理操作。

用户状态通过响应式 `whoami` 获取，提醒通过 `attention` 读取和更新。登录交互、管理模式切换及处罚记录请求由内置组件处理；认证会话的启动和销毁统一由 kit 管理。`kit.api` 与 `useWebKit().api` 是同一个只读对象，不包含底层会话的生命周期、订阅或登录消息处理方法。

宿主业务工厂若接收 `kit.api`，参数使用 `WebKitApi`（或 `WebKitContext['api']`）。业务客户端可单独设置超时，例如 `api.createClient('/api/', { timeout: 60_000 })`；认证请求使用默认超时。管理模式仅影响界面交互，业务操作仍由服务端校验权限。

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
import { useWebKit } from '@novelia/web-kit';

const { attention } = useWebKit();

attention.status.value?.strikes.hasUnread;
attention.refresh();
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

已启动的 kit 释放时也会清空通知。原来的 `useWebKit().notifications.notify` 改用 `Notify`，`notifications.dismissAll()` 改用 `Notify.dismissAll()`；不再导出 `Notifications` 类型或 `attentionKey`。提醒状态从 `useWebKit().attention` 读取，主题从 `useWebKit().theme` 读取；两个上下文都只提供状态和公开方法，生命周期由 kit 管理。`useWebKit()` 是唯一的 kit 上下文入口，其他 hook 只在有独立注入源时才单独存在（目前只有 `useWebKitLayout()`）。

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

主题在启动时写入 `<html data-theme>`，无已保存偏好时采用当时的系统主题，切换后写 `localStorage`（键默认 `<auth.app>-web-theme`，可用 `themeStorageKey` 覆盖）。侧边栏底部的按钮已经接好了，业务里要用就 `useWebKit().theme`，拿 `{ isDark, theme, toggleTheme }`。

## 侧栏构建信息

上面 `createWebKit` 里的 `repository` 就是干这个的，配上之后桌面侧栏和移动端导航底部会显示 `SidebarFooter`。

`buildTime` 由应用的构建配置给 ISO 时间字符串，`commitSha` 给对应的 Git 提交哈希。页脚按浏览器本地时区显示时间，提交哈希截短到 12 位并链到仓库的提交页；哈希是 `unknown` 或空字符串就不生成链接，时间无效则不显示时间。不配 `repository` 不显示页脚，侧栏收起时保留 Commit 图标，悬停或键盘聚焦可查看构建信息。

## 提示框

`XTooltip` 封装提示框的 Provider、Portal 和统一样式。`trigger` 插槽提供一个可聚焦的触发元素，默认插槽提供提示内容：

```vue
<script setup lang="ts">
import { XTooltip } from '@novelia/web-kit';
</script>

<template>
  <XTooltip side="right">
    <template #trigger>
      <button type="button">构建信息</button>
    </template>
    当前版本的构建时间和提交号
  </XTooltip>
</template>
```

支持 `side`（默认 `top`）、`align`（默认 `center`）、`sideOffset`（默认 8px）和 `delayDuration`（默认 200ms）。额外属性及 `class` 传给提示内容容器；触发元素的属性直接写在插槽内。组件和 `XTooltipProps` 类型均从 `@novelia/web-kit` 导出。
