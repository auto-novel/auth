# @novelia/auth-api

Auth API 的浏览器端 TypeScript 接口包，不依赖具体 UI 框架。各前端共用这里的
认证会话、通用账户管理接口、请求客户端与错误处理；仅特定管理应用使用的接口由应用自身维护。

```ts
import { createAuthApi } from '@novelia/auth-api';

const api = createAuthApi({
  baseUrl: 'https://auth.example.com/api/v1',
  app: 'example',
  storage: { key: 'example-session', target: localStorage },
});

await api.refresh();
const page = await api.getMyStrikes({ page: 1, pageSize: 50 });
```

必须通过 `createAuthApi` 显式配置 `baseUrl` 和 `app`。客户端会等待初始会话恢复，并在请求携带的访问令牌被服务端标记为无效时刷新并重试一次，同时定时刷新已签发满一小时的令牌。配置 `storage` 后访问令牌会持久化到指定存储；可通过 `api.watchUser()` 观察不含令牌的用户身份。需要访问其他服务时，可通过 `api.createClient(baseUrl)` 创建复用同一登录会话的请求客户端；省略 `baseUrl` 时使用认证服务地址。
