# @novelia/admin-kit

内部管理网站共用的 Vue 组件库，提供登录、权限校验、响应式布局、侧边栏、账号菜单和主题切换。

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
