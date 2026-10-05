# @novelia/admin-kit

内部管理网站共用的 Vue 组件库，提供登录、权限校验、响应式布局、侧边栏、账号菜单和主题切换。

## 生命周期与运行环境

Admin Kit 仅用于浏览器。每个浏览器中的已加载模块运行时只能成功调用一次
`createAdminKit`；再次调用会抛错，不会忽略新配置并返回已有实例。
首次配置校验失败（例如无效的认证 URL）不会占用这次创建机会。
这不是 SSR 请求安全的单例，不应在服务端跨请求共享或创建。

一个 Kit 只能由一个 Vue 应用拥有：在同一应用上重复安装无副作用，
安装到其他应用会抛错。应用卸载时通过 `app.onUnmount` 自动调用
`adminKit.dispose()`，也可由创建者主动调用它释放认证订阅、定时器和存储监听。
`dispose()` 可重复调用，但已释放的 Kit 不能再次安装，且释放不会重置创建次数限制。
组件通过 `useAdminKit()` 获取 `AdminKitContext`，不暴露安装和释放方法。

## 使用

创建并注册 Admin Kit，同时安装路由守卫：

```ts
import { createAdminAuthGuard, createAdminKit } from '@novelia/admin-kit';

const adminKit = createAdminKit({
  auth: {
    app: 'example',
    url: 'https://auth.novelia.cc',
  },
  brand: 'Example',
});

router.beforeEach(createAdminAuthGuard(adminKit));
createApp(App).use(adminKit).use(router).mount('#app');
```

根组件使用 `AdminKitApp`，需要登录的页面使用 `AdminKitLayout`：

```vue
<AdminKitApp>
  <AdminKitLayout v-if="route.meta.requiresAuth" :menu-options="menuOptions" />
  <RouterView v-else />
</AdminKitApp>
```

登录路由使用 `AdminLoginView`，并将受保护路由标记为 `requiresAuth`：

```ts
const routes = [
  {
    path: '/login',
    name: 'login',
    component: AdminLoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/',
    redirect: '/overview',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'overview',
        component: OverviewView,
        meta: { title: '概览' },
      },
    ],
  },
];
```

登录路由名称固定为 `login`，`/` 应重定向到默认首页。侧边栏菜单由 `menuOptions` 提供。

导航菜单项使用 `AdminKitMenuOption`，并通过 `to` 指定 Vue Router
目标。带有 `to` 的菜单项会渲染为原生链接，支持浏览器右键菜单、中键以及
Ctrl/Cmd 点击打开新标签页；不带 `to` 的项仍作为普通动作处理：

```ts
import type { AdminKitMenuOption } from '@novelia/admin-kit';

const menuOptions: AdminKitMenuOption[] = [
  { label: '概览', key: '/overview', to: { name: 'overview' } },
];
```
