# 生产部署说明

## 运行环境

后端运行在 CloudBase 云托管，使用 Node.js 20 容器、Fastify、Prisma 与 PostgreSQL。云托管服务必须监听平台注入的 `PORT`；当前服务通过 `process.env.PORT` 读取该端口。

在 CloudBase 服务端环境变量中配置下列值，禁止写入 Git、小程序或镜像：

```text
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>?sslmode=require
DEEPSEEK_API_KEY=<server-only-secret>
AI_PROVIDER=deepseek
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
PUBLIC_API_BASE_URL=https://<cloudbase-service-domain>
CORS_ORIGINS=https://servicewechat.com
LOG_LEVEL=info
```

`REDIS_URL` 可选；未配置或不可用时，限流与幂等保护会降级为单实例内存模式。生产多实例建议配置 Redis。

## 数据库迁移与初始化

在开发环境创建迁移：

```bash
npx prisma migrate dev --name <migration-name>
```

生产环境仅执行已提交的迁移，不使用 `migrate dev`：

```bash
npx prisma migrate deploy
npx prisma db seed
```

首次上线在 CloudBase 可访问 PostgreSQL 的受控运维环境执行一次迁移与 seed。后续发布只在存在新增迁移时执行 `npx prisma migrate deploy`；seed 是幂等导入，可按需执行。

## 镜像构建与云托管发布

本地验证：

```bash
npm ci
npm run build
npm test
docker build -t ai-restaurant-review-backend .
```

在 CloudBase 控制台创建云托管服务，构建上下文选择 `backend/`，Dockerfile 选择 `backend/Dockerfile`。配置上节中的服务端环境变量和健康检查路径：

```text
存活检查：GET /health
就绪检查：GET /ready
```

发布后验证：

```bash
curl https://<cloudbase-service-domain>/health
curl https://<cloudbase-service-domain>/ready
```

## 回滚

1. 在 CloudBase 将流量切回上一稳定版本。
2. 不回滚已执行的数据库迁移；通过新的正向迁移修复数据结构问题。
3. 通过 `/ready` 确认 PostgreSQL 连通后再恢复流量。
