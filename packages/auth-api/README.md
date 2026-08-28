# @novelia/auth-api

Auth API 的浏览器端 TypeScript 接口包，不依赖具体 UI 框架。管理端和
`@novelia/admin-kit` 共用这里的请求、类型与错误处理。

```ts
import { createAuthApi } from '@novelia/auth-api';

const api = createAuthApi({
  baseUrl: 'https://auth.example.com/api/v1',
  app: 'example',
  storage: { key: 'example-session', target: localStorage },
});

await api.auth.refresh();
const page = await api.me.getStrikes({ page: 1, pageSize: 50 });
```

必须通过 `createAuthApi` 显式配置 `baseUrl` 和 `app`。接口按 `auth`、`admin`、`me`
分组；客户端会管理访问令牌，在受保护请求首次收到 401 后刷新并重试
一次，同时定时刷新已签发满一小时的令牌。配置 `storage` 后访问令牌会持久化到指定存储；可通过
`api.subscribeUser()` 订阅不含令牌的用户身份。
