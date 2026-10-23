# 贡献指南

欢迎为本项目贡献！为了确保高效协作，我们有以下建议。

- 如果您计划实现较大的功能或变更，请先通过 Issue 或聊天群联系管理员讨论。
- 请保持 Pull Request 的内容精简，聚焦于一个独立的修改点，以便快速检视和合入。

## 以调试模式启动服务

在仓库根目录执行以下命令，以调试模式启动服务：

```bash
export COMPOSE_FILE="docker-compose.yml:docker-compose.debug.yml"
docker compose up -d
```

服务启动后，可通过以下地址访问：

- Web：http://localhost:4000
- API：http://localhost:4000/api
- PostgreSQL：localhost:4001

## 前端开发

基于 Vue 3 / TypeScript / Vite 构建。

在仓库根目录执行：

```bash
pnpm install   # 安装依赖
pnpm dev:web   # 启动用户端开发服务器
pnpm dev:admin # 启动管理端开发服务器
pnpm build     # 构建用户端和管理端
```

开发服务器默认连接线上后端，请勿污染线上数据。

若需要在手机等设备调试，可添加 `--host` 参数启动服务。

## 后端开发

基于 Go / chi / PostgreSQL / Jet 开发。以下命令除目录切换外，均在 `apps/api` 目录执行。

构建项目：

```bash
cd apps/api
go mod download
./script/build_jet.sh # 生成 Jet SQL 代码
go build
```

运行单元测试：

```bash
go clean -testcache
go test ./... -v -p 4
```

运行集成测试（需要 Docker）：

```bash
./script/test_integration.sh -v
```
