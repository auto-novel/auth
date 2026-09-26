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

角色判断使用 `isKnownRole` 和 `isRoleAtLeast`。未知角色不会获得权限：

```ts
import { isRoleAtLeast } from '@novelia/auth-api';

const canPost = isRoleAtLeast(user?.role, 'member');
```

账号创建时间使用 Unix 秒。需要判断账号是否满指定天数时，可传入当前时间（毫秒）；恰好达到天数时返回 `true`：

```ts
import { isAccountAtLeastDaysOld } from '@novelia/auth-api';

const oldEnough = isAccountAtLeastDaysOld(user, 30);
```

业务 API 可单独设置超时；认证 API 仍使用默认超时：

```ts
const novelClient = api.createClient('/api/', { timeout: 60_000 });
```
