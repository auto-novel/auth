# @novelia/web-kit

## 侧栏构建信息

在 `createWebKit` 中传入可选的 `repository` 配置，即可在桌面侧栏和移动端导航底部显示 `SidebarFooter`：

```ts
const webKit = createWebKit({
  auth: { app: 'f', url: '/auth' },
  brand: '论坛',
  repository: {
    url: 'https://github.com/auto-novel/forum',
    buildTime: '2026-09-10T12:00:00Z',
    commitSha: '0123456789abcdef0123456789abcdef01234567',
  },
});
```

`buildTime` 应由应用的构建配置提供 ISO 时间字符串，`commitSha` 应为对应的 Git 提交哈希。页脚使用浏览器本地时区显示时间，提交哈希缩短为 12 位并链接至仓库的提交页面。提交哈希为 `unknown` 或空字符串时不生成链接，无效时间显示为“未知时间”。

未配置 `repository` 时不显示页脚；侧栏收起时，页脚隐藏且不参与键盘焦点导航。
