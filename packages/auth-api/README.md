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

管理模式是当前账号的界面状态，仅管理员能开启。订阅会立即收到当前值；切换方法返回实际状态。开启后会随会话存储和跨标签页同步，退出或切换账号时自动关闭：

```ts
const stopWatching = api.watchAdminMode((enabled) => {
  console.log('管理模式：', enabled);
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
