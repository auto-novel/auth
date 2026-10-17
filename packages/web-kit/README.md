# @novelia/web-kit

Vue 3 共享组件与工具，提供登录、布局、主题、通知和文件上传。直接导出源码。

## 接入

依赖 Vue 3.5+、Vue Router 5.2+、Tailwind CSS 4.3+ 和 `@vicons/material`。

样式入口：

```css
@import 'tailwindcss';
@import '@novelia/web-kit/styles.css';
```

应用入口：

```ts
import { createApp } from 'vue';
import { createWebKit } from '@novelia/web-kit';
import App from './App.vue';
import router from './router';
import './style.css';

const webKit = createWebKit({
  auth: { app: 'f', url: '/auth' },
  brand: '论坛',
});

createApp(App).use(webKit).use(router).mount('#app');
```

`auth.app` 填认证服务的应用标识，`auth.url` 填认证服务地址。`createWebKit()` 只在入口调用一次。

根组件挂载 `WebKitApp`；需要侧栏时再使用 `WebKitLayout`：

```vue
<script setup lang="ts">
import { WebKitApp } from '@novelia/web-kit';
</script>

<template>
  <WebKitApp><RouterView /></WebKitApp>
</template>
```

Vite 配置的插件列表加入 `themeBootstrapPlugin()`，避免首次加载主题闪烁：

```ts
import { themeBootstrapPlugin } from '@novelia/web-kit/vite';
```

## 接口与示例

- [包入口](./src/index.ts)：公开组件、函数和类型。
- [配置与菜单类型](./src/types.ts)：`createWebKit` 配置和布局菜单。
- [Playground](./playground/)：组件和主题示例。
- [测试](./tests/)：关键行为约定。

## 开发

在仓库根目录执行：

```sh
pnpm dev:web-kit
pnpm --filter @novelia/web-kit test
pnpm --filter @novelia/web-kit build
```
