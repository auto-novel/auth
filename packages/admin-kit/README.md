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

菜单项使用 `AdminKitMenuOption`，`key` 是必填的唯一字符串或数字标识，
不作为路由路径使用。菜单项分为三种：

- 导航项通过 `to` 指定 Vue Router 目标，渲染为原生链接，支持右键、中键和 Ctrl/Cmd 开新标签页。
- 动作项通过 `onSelect` 指定回调，不执行隐式导航。
- 子菜单通过 `children` 提供嵌套项，自身不指定 `to` 或 `onSelect`。

```ts
import type { AdminKitMenuOption } from '@novelia/admin-kit';

const menuOptions: AdminKitMenuOption[] = [
  { label: '概览', key: 'overview', to: { name: 'overview' } },
  { label: '导出', key: 'export', onSelect: () => exportData() },
];
```

导航高亮按 `router.resolve(to).path` 与当前路径精确匹配，不比较 query/hash；
支持命名路由、参数、嵌套菜单和数字 key，无匹配时不选中任何项。
隐藏项不参与匹配，禁用项不会触发导航或动作。
所有 key 应唯一，不能使用内置保留值 `admin-kit-theme-divider`、`admin-kit-theme-toggle`。
原来省略 `to` 的动作项需补上 `onSelect`；导航项必须显式提供 `to`，不再从 key 推导。
