# @novelia/auth-api

Auth API 的浏览器端 TypeScript 接口包，不依赖具体 UI 框架。登录页、管理端和
`@novelia/admin-kit` 共用这里的请求、类型与错误处理。

```ts
import { createAuthApi, type AccessTokenSession } from '@novelia/auth-api';

const session: AccessTokenSession = {
  getAccessToken: () => accessToken,
  refreshAccessToken: refreshToken,
};

const api = createAuthApi({
  baseUrl: 'https://auth.example.com/v1',
  session,
});

await api.auth.login({ app: 'example', username, password });
const page = await api.me.getStrikes({ page: 1, pageSize: 50 });
```

必须通过 `createAuthApi` 显式配置 `baseUrl`。接口按 `auth`、`admin`、`me`
分组；访问带权限的接口时还必须配置 `AccessTokenSession`，客户端会在首次收到
401 后刷新令牌、重试一次。
