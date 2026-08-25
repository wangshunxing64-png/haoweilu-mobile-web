# 现在部署数据库并启动后端

这份文档只描述当前项目第一次启动所需步骤。后端会在监听端口之前检查 PostgreSQL；数据库不可用时进程直接启动失败，不会出现“HTTP 已启动但数据库其实没连上”的假健康状态。

## 0. 运行要求

- Node.js 22.12+
- npm
- PostgreSQL 16+（本地 Docker 已配置 16）
- Redis 7+（强烈建议生产使用；不可用时后端会降级为单进程内存限流/幂等）

先确认：

```bash
node -v
npm -v
```

## 路径 A：本机 Docker 一键启动（最快验证）

进入后端目录：

```bash
cd backend
```

如要启用 DeepSeek，可先创建根目录 `.env`：

```bash
cp .env.development.example .env
```

默认 `DEFAULT_AI_PROVIDER=local-template`，因此不配置 DeepSeek Key 也能完整跑业务链。

一键构建并启动 PostgreSQL、Redis、迁移、Seed 和 API：

```bash
docker compose up --build
```

Docker Compose 会按顺序执行：

```text
PostgreSQL healthy
→ migration.sql / Prisma migrate deploy
→ Seed 李记好味道商户数据
→ Redis healthy
→ API 启动
→ /ready 数据库就绪探针
```

另开终端验证：

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

预期 `/health`：

```json
{
  "status": "ok",
  "service": "ai-restaurant-review-backend"
}
```

预期 `/ready`：

```json
{
  "status": "ready",
  "database": "ok"
}
```

Swagger：

```text
http://localhost:3000/docs
```

停止服务：

```bash
docker compose down
```

停止并删除本地数据库卷（会清空本地数据，仅测试时使用）：

```bash
docker compose down -v
```

---

## 路径 B：部署到你自己的 PostgreSQL / Redis

### 1. 安装依赖

```bash
cd backend
npm install
```

第一次成功安装后会生成 `package-lock.json`。正式部署建议保留并提交它，后续改用 `npm ci`。

### 2. 创建生产环境文件

```bash
cp .env.production.example .env
```

至少修改：

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
TRUST_PROXY=true

PUBLIC_API_BASE_URL=https://你的后端域名
DATABASE_URL=postgresql://用户名:密码@数据库主机:5432/数据库名?schema=public&sslmode=require
DIRECT_URL=
DATABASE_POOL_MAX=10
DATABASE_CONNECTION_TIMEOUT_MS=5000
DATABASE_IDLE_TIMEOUT_MS=30000
REDIS_URL=rediss://:密码@Redis主机:6379/0
CORS_ORIGINS=https://你的H5域名

DEFAULT_AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=你的DeepSeek服务端Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash

ADMIN_API_KEY=一段足够长的随机管理密钥
```


如果你的云数据库同时提供“应用连接池 URL”和“数据库直连 URL”（例如外部 PgBouncer / 云连接池），建议：

```env
DATABASE_URL=应用运行时使用的池化连接
DIRECT_URL=迁移命令使用的数据库直连连接
```

如果没有单独的直连地址，`DIRECT_URL` 留空即可，Prisma CLI 自动使用 `DATABASE_URL`。

`DATABASE_POOL_MAX` 是**每个 API 实例**的 PostgreSQL 最大连接数。多实例部署时总连接上限约等于 `每实例连接数 × API 实例数`，不要超过你的数据库套餐连接上限。

如果第一阶段不想消耗 AI API：

```env
DEFAULT_AI_PROVIDER=local-template
DEEPSEEK_API_KEY=
```

> `TRUST_PROXY=true` 只在 Fastify 位于你可信任的 Nginx / Caddy / 云负载均衡器之后时开启；直接暴露 Fastify 端口时保持 `false`。

### 3. 初始化数据库

第一次部署可以直接执行：

```bash
npm run db:bootstrap
```

它等价于：

```bash
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
```

检查迁移状态：

```bash
npm run db:status
```

### 4. 验证代码

```bash
npm run verify
```

必须全部通过后再启动生产进程。

### 5. 构建并启动

```bash
npm run build
npm start
```

进程启动时会先执行 PostgreSQL `SELECT 1`。数据库连接失败则进程退出，不会继续监听端口。

### 6. 检查健康状态

```bash
curl https://你的后端域名/health
curl https://你的后端域名/ready
```

`/health` 代表 Node/Fastify 进程存活；`/ready` 代表 PostgreSQL 可以真实执行查询。生产负载均衡器应优先使用 `/ready` 作为就绪检查。

---

## 第一次数据库部署完成后必须检查

```bash
npm run db:status
```

然后在 PostgreSQL 中确认至少存在这些表：

```text
Merchant
Store
Dish
ExperienceTag
PublishPlatform
ReviewSession
Review
PublishRecord
RewardRecord
AnalyticsEvent
```

再验证 Seed：

```bash
curl http://localhost:3000/api/merchants/liji
```

正常应返回 `李记好味道` 的商户配置、菜品、体验标签和发布平台。

## DeepSeek 开启方式

Seed 会把 `DEFAULT_AI_PROVIDER` 写入商户配置，所以如果首次 Seed 时希望直接使用 DeepSeek，需要确保：

```env
DEFAULT_AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=真实服务端Key
```

客户端请求里的 `provider` / `model` 仅保留用于兼容现有小程序请求结构，**不能决定服务端真正调用哪个模型**。真正 Provider 由数据库里的商户 AI 配置决定，防止前端被篡改后恶意消耗模型额度。

如果 DeepSeek 超时、失败、Key 缺失或生成结果不满足 3 条有效评价，服务端自动使用 `LocalFallbackProvider`。

## 数据库变更原则

生产环境：

```bash
npm run db:migrate:deploy
```

开发环境需要创建新迁移时才使用：

```bash
npm run db:migrate
```

不要在生产数据库执行 `prisma migrate dev`。

## 当前初始化迁移

首个 migration 位于：

```text
prisma/migrations/202608170001_init/migration.sql
```

Seed 位于：

```text
prisma/seed.ts
```

## 故障判断

### `/health` 正常但 `/ready` 503

说明 API 进程存活，但 PostgreSQL 不可用。优先检查：

```text
DATABASE_URL
数据库 IP 白名单
SSL 参数
数据库用户权限
网络 / 安全组
PostgreSQL 实例状态
```

### Redis 连接失败

API 仍可启动，但日志会出现 Redis fallback 警告。此时限流和幂等只在当前 Node 进程内有效；生产多实例部署必须恢复 Redis。

### DeepSeek 失败

不会导致评价流程整体失败，服务端会退回本地模板。检查日志中的 `provider`、`reason` 和耗时即可；日志不会打印顾客原始输入或 API Key。
