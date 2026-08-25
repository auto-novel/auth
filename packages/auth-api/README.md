# @novelia/auth-api

Auth API 的浏览器端 TypeScript 接口包，不依赖具体 UI 框架。登录页、管理端和
`@novelia/admin-kit` 共用这里的请求、类型与错误处理。

```ts
import {
  getMyStrikes,
  login,
  type AccessTokenSession,
} from '@novelia/auth-api';

await login({ app: 'example', username, password });

const session: AccessTokenSession = {
  getAccessToken: () => accessToken,
  refreshAccessToken: refreshToken,
};
const page = await getMyStrikes(session, { page: 1, pageSize: 50 });
```

接口默认请求同源的 `/api/v1`。子网页需要访问其他地址时，可在每个接口最后一个
参数传入 `{ baseUrl: 'https://auth.example.com/v1' }`。带权限的接口统一通过
`AccessTokenSession` 获取令牌，并在首次收到 401 后刷新令牌、重试一次。
