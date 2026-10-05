# @novelia/auth-api

Auth API 的浏览器端 TypeScript 接口包，不依赖具体 UI 框架。各前端共用这里的
认证会话、通用账户管理接口、请求客户端与错误处理；仅特定管理应用使用的接口由应用自身维护。

```ts
import { createAuthApi } from '@novelia/auth-api';

const api = createAuthApi({
  url: 'https://auth.example.com/',
  app: 'example',
  storage: { key: 'example-session', target: localStorage },
});

const isSignedIn = await api.checkSignedIn();
const page = await api.getMyStrikes({ page: 1, pageSize: 50 });
```

## 会话生命周期

`autoStart` 默认是 `true`，直接创建 API 时仍会立即读取存储、监听跨标签页变化、执行初始登录检查并启动定时刷新。框架 kit 可设置 `autoStart: false`，将这些副作用延迟到挂载时的 `start()`；构造阶段不读取或清理存储，也不发请求或创建监听器、定时器：

```ts
const api = createAuthApi({
  url: 'https://auth.example.com/',
  app: 'example',
  storage: { key: 'example-session', target: localStorage },
  autoStart: false,
});
const stopWatching = api.watchUser((user) => console.log(user));
// 挂载时：读取存储并向已有订阅发布当前用户，再启动同步和刷新。
api.start();
await api.checkSignedIn();
// 卸载时：清理资源和内存中的令牌，不清除持久化会话。
stopWatching();
api.dispose();
```

`watchUser` 可以在启动前注册，只订阅内存状态（初始用户为 `undefined`），不触发外部副作用；`createClient` 和 `createLoginUrl` 也可以在启动前调用。登录检查、客户端请求、令牌刷新、退出及管理模式切换必须在 `start()` 之后、`dispose()` 之前使用，否则会抛错或返回拒绝的 Promise。

`start()` 在未销毁时可重复调用，不会重复分配资源；`dispose()` 也可重复调用，包括从未启动的会话。销毁会移除订阅和已分配的监听器、定时器，并使未完成的刷新失效，不能再订阅或重新启动。启动中途失败会清理已分配资源并销毁会话；需要重试时请创建新 API。

角色值判断使用 `isKnownRole` 和 `isRoleAtLeast`。对用户资料的常用判断则收敛在
`AuthUser` 下；未登录用户和未知角色均不会获得权限：

```ts
import { AuthUser } from '@novelia/auth-api';

const canPost = AuthUser.hasRoleAtLeast(user, 'member');
```

账号创建时间使用 Unix 秒。需要判断账号是否满指定天数时，可传入当前时间（毫秒）；恰好达到天数时返回 `true`：

```ts
import { AuthUser } from '@novelia/auth-api';

const oldEnough = AuthUser.isAtLeastDaysOld(user, 30);
```

`AuthUser.isAdmin(user)` 可用于管理员界面判断。

管理模式是 `AuthUser` 的 `adminMode` 属性；`AuthUser.asAdmin(user)` 可判断当前是否以管理员模式使用界面。仅管理员能开启。`watchUser` 会立即提供当前用户，并在管理模式变化时再次通知；开启后会随会话存储和跨标签页同步，退出或切换账号时自动关闭：

```ts
const stopWatching = api.watchUser((user) => {
  console.log('管理模式：', user?.adminMode);
  console.log('以管理员身份使用：', AuthUser.asAdmin(user));
});

api.setAdminMode(true);
api.toggleAdminMode();
stopWatching();
```

管理模式不会改变服务端权限；业务操作仍须由服务端校验。

业务 API 可单独设置超时；认证 API 仍使用默认超时：

```ts
const novelClient = api.createClient('/api/', { timeout: 60_000 });
```
