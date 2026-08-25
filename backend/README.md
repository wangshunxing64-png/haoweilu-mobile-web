# AI 餐饮评价助手 Backend

基于现有 `miniapp/` 源码业务结构搭建的后端。后端不改变 Stitch UI，重点把商户配置、会话、AI 生成、发布状态、奖励与埋点从前端本地逻辑迁移到服务端。

## 技术栈

- Node.js 22.12+ + TypeScript
- Fastify
- PostgreSQL + Prisma
- Redis + ioredis
- Zod
- DeepSeek Provider + LocalFallbackProvider
- OpenAPI / Swagger
- Docker Compose

## 目录

```text
backend/
├── src/
│   ├── ai/                       # AI Provider 与统一生成器
│   ├── common/                   # 错误、内容过滤、幂等、HTTP
│   ├── config/                   # 环境变量
│   ├── infrastructure/           # Prisma / Redis / Store
│   ├── modules/                  # merchants/sessions/reviews/publish/rewards/analytics
│   ├── app.ts                    # Fastify 组装
│   └── server.ts                 # 生产启动入口
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
├── docs/
├── ops/
├── Dockerfile
└── docker-compose.yml
```

## 本地启动

### 1. 准备环境

```bash
cp .env.development.example .env
npm install
```

### 2. 启动 PostgreSQL 与 Redis

```bash
docker compose up -d postgres redis
```

### 3. 初始化数据库

```bash
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
```

### 4. 启动 API

```bash
npm run dev
```

默认地址：

- API: `http://localhost:3000`
- Liveness: `http://localhost:3000/health`
- Readiness: `http://localhost:3000/ready`
- Swagger: `http://localhost:3000/docs`


## 第一次部署数据库

如果你现在就要部署数据库，直接看：

```text
docs/DEPLOY_NOW.md
```

首次数据库初始化可使用：

```bash
npm run db:bootstrap
```

随后检查：

```bash
npm run db:status
curl http://localhost:3000/ready
```

## DeepSeek

开发阶段可继续使用本地模板。需要启用 DeepSeek 时：

```env
DEFAULT_AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=你的服务端密钥
DEEPSEEK_MODEL=deepseek-v4-flash
```

API Key 只放后端 `.env`，禁止写入小程序源码。

AI 服务异常、超时、返回内容不足 3 条或返回重复内容时，统一生成器自动走 `LocalFallbackProvider`，保证前端仍拿到 3 条可用评价。

## 与当前小程序兼容的 AI 请求

当前 `miniapp/src/services/review-service.js` 的请求结构可直接被后端接收。注意：其中 `provider` / `model` 仅作为客户端兼容字段；真正调用的 AI Provider 由服务端商户配置决定，客户端不能强制切换模型：

```json
{
  "provider": "deepseek",
  "model": "deepseek-v4-flash",
  "merchantId": "liji",
  "input": {
    "dishes": ["pickled-pork"],
    "tags": ["tasty", "generous"],
    "message": "朋友推荐来的，酸菜蹄膀很香"
  }
}
```

响应：

```json
{
  "sessionId": "...",
  "reviews": [
    {
      "id": "...",
      "styleId": "daily",
      "styleName": "日常分享型",
      "styleLabel": "生动接地气",
      "content": "...",
      "provider": "deepseek"
    }
  ]
}
```

前端原逻辑只读取 `reviews`，因此新增的 `sessionId` 不会破坏现有调用；完成全链路服务端化时应把 `sessionId` 保存进前端会话。

## API

| Method | Path | 说明 |
|---|---|---|
| GET | `/health` | 进程存活检查 |
| GET | `/ready` | PostgreSQL 就绪检查 |
| GET | `/api/merchants/:merchantId` | 商户/门店完整配置 |
| POST | `/api/sessions` | 创建匿名会话 |
| GET | `/api/sessions/:id` | 查询会话 |
| PATCH | `/api/sessions/:id` | 更新菜品、标签、补充内容 |
| POST | `/api/reviews/generate` | 生成 3 条评价 |
| POST | `/api/reviews/:id/select` | 选定评价；可附带 `content` 保存顾客最终微调文本 |
| POST | `/api/publish/prepare` | 获取复制文本与平台跳转参数 |
| POST | `/api/publish/complete` | 用户确认完成发布 |
| POST | `/api/rewards/claim` | 领取一次性兑奖码 |
| POST | `/api/events` | 接收埋点 |
| GET | `/api/admin/analytics/funnel` | 转化漏斗 |
| GET | `/api/admin/analytics/summary` | 漏斗 + AI 次数 + 平台点击分布 |

后台统计接口使用请求头：

```text
x-admin-key: <ADMIN_API_KEY>
```

## 幂等

建议以下写接口携带：

```text
Idempotency-Key: <8-128 位请求唯一值>
```

已接入：

- 创建 Session
- AI 生成
- 发布准备
- 发布确认
- 奖励领取
- 埋点

Redis 可用时使用 Redis 锁与结果缓存；Redis 不可用时退化为单实例内存幂等。奖励同时使用数据库 `sessionId UNIQUE` 与 `code UNIQUE` 约束。

## 安全约束

- CORS 只允许 `CORS_ORIGINS` 白名单；无浏览器 Origin 的小程序服务请求不受 CORS 影响。
- `x-request-id` 支持客户端透传，非法值自动重建。
- Pino 日志脱敏 Authorization、Cookie、管理密钥等 Header。
- 埋点会递归剔除 `message/content/text/token/secret/password` 等敏感字段。
- AI 原始用户输入不进入请求日志。
- `CONTENT_BLOCKLIST` 可按运营合规规则配置敏感词。
- AI 接口拥有独立限流额度。
- `TRUST_PROXY` 默认关闭；只有部署在可信反向代理/负载均衡器之后时才开启，确保按真实客户端 IP 限流。
- 用户必须至少选择 1 道真实品尝过的菜品才能生成评价。

## 发布与奖励口径

`POST /api/publish/complete` 只代表：**用户主动确认自己已经完成第三方平台发布操作**。

后端不会伪装成大众点评 / 美团官方验证，也不会声称已经从第三方读取到评论发布结果。

只有发布确认成功后，`POST /api/rewards/claim` 才能返回 6 位一次性奖励码。

## 会话清理

会话默认 24 小时过期。服务每 `SESSION_CLEANUP_INTERVAL_MS` 自动删除已过期会话，其 Reviews / PublishRecord / RewardRecord 由数据库级联清理，与该 Session 绑定的埋点会按外键策略解除/清理。

## PostgreSQL 连接池

运行时连接池通过以下变量控制：

```env
DATABASE_POOL_MAX=10
DATABASE_CONNECTION_TIMEOUT_MS=5000
DATABASE_IDLE_TIMEOUT_MS=30000
```

如果数据库提供外部连接池，可让 `DATABASE_URL` 指向池化地址，并把 `DIRECT_URL` 指向迁移使用的直连地址；未设置 `DIRECT_URL` 时 Prisma CLI 自动使用 `DATABASE_URL`。

## 数据备份

Docker Compose 环境可执行：

```bash
./ops/backup-postgres.sh
```

备份写入 `backups/`，该目录默认不进入 Git。生产环境应把该脚本交给系统定时任务或云数据库自动备份策略执行，并针对 `/health`、5xx 比例、数据库连接失败和 AI Provider fallback 比例配置监控告警。

## 测试与构建

```bash
npm run test:domain
npm run test:api
npm run typecheck
npm run build
```

完整发布前还应在项目 `miniapp/` 中执行：

```bash
npm test
npm run build:h5
npm run build:mp-weixin
```

## 生产部署顺序

1. 创建正式 PostgreSQL / Redis。
2. 配置 HTTPS API 域名与 `PUBLIC_API_BASE_URL`。
3. 配置 `CORS_ORIGINS`、`ADMIN_API_KEY`、DeepSeek Key。
4. `npm run db:migrate:deploy`。
5. 首次部署执行 `npm run db:seed`。
6. 启动服务并同时检查 `/health` 与 `/ready`。
7. 在微信小程序后台加入正式 API 合法请求域名。
8. 上线前执行扫码并发与 AI 限流压测。
9. 保留上一版本镜像和数据库备份，作为回滚入口。
