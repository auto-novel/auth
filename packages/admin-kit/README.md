# @novelia/admin-kit

内部管理网站共用的 Vue 组件库，提供登录、权限校验、响应式布局、侧边栏、账号菜单和主题切换。

## 生命周期与运行环境

Admin Kit 仅用于浏览器。每个浏览器中的已加载模块运行时只能成功调用一次
`createAdminKit`；再次调用会抛错，不会忽略新配置并返回已有实例。
首次配置校验失败（例如无效的认证 URL）不会占用这次创建机会。
这不是 SSR 请求安全的单例，不应在服务端跨请求共享或创建。

两个 kit 使用相同的生命周期契约：

- `createAdminKit()` 只构造配置与内存状态，不读取会话/主题存储内容、不发请求、不注册监听器或定时器。
- `adminKit.start()` 启动认证会话和主题。`app.use(adminKit)` 会自动调用它，通常不需要手动启动；重复启动无副作用。
- `install` 提供上下文并注册 `app.onUnmount` 清理。一个 kit 只能安装到一个 Vue 应用，同一应用重复安装无副作用，跨应用安装会抛错。
- `adminKit.dispose()` 释放订阅、监听器、定时器及内存用户状态，不清除持久化登录会话。未启动时也可释放，重复释放无副作用。

销毁是终态：之后不能启动或安装，也不重置单实例创建限制。同步启动或安装失败会清理已分配资源并销毁 kit，重新启动应用需要重载页面。
组件通过 `useAdminKit()` 获取 `AdminKitContext`，不暴露 `start`、`install` 或 `dispose`；会话与主题的生命周期应统一由 kit 管理。

kit、组件上下文和主题上下文的对象外壳均被冻结，类型中的字段也只读，不能替换 `profile`、`theme`、配置或方法。`profile` 的 Ref 与用户字段深只读，配置是复制后冻结的快照。主题只公开只读的 `isDark` 和 `toggleTheme()`，修改主题必须通过该方法，内部 `start`/`dispose` 不会暴露。冻结对象外壳不会阻止 Ref 随内部状态更新；`api` 只禁止替换引用，其原有接口与调用能力不变。

创建后 `profile` 为 `undefined`，主题使用初始浅色，启动时才恢复存储状态。
`start()` 只启动同步，不等待网络登录检查；需要等待时，在启动后调用 `await adminKit.api.checkSignedIn()`。
请先安装 kit 再安装 router，确保首次路由守卫使用已启动的会话；创建业务客户端和注册守卫仍可在启动前完成。

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
