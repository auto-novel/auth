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
