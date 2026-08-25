# 部署、监控与回滚

## 上线前

1. 准备独立 PostgreSQL 与 Redis 实例。
2. 正式环境使用 `.env.production.example` 的字段集合，并把真实密钥放进部署平台 Secret，不提交到仓库。
3. 配置 HTTPS API 域名；`PUBLIC_API_BASE_URL` 使用最终 HTTPS 地址。
4. `CORS_ORIGINS` 只写正式 H5 域名；在可信 Nginx/Caddy/负载均衡器后部署时设置 `TRUST_PROXY=true`。
5. 首次环境执行 `npm run db:bootstrap`；后续发布只执行 `npm run db:migrate:deploy`。
6. 同时检查 `GET /health`、`GET /ready` 与 Swagger 文档。
7. 微信小程序后台加入正式 API 合法请求域名。

## 压测

扫码/配置读取：

```bash
LOAD_TEST_BASE_URL=https://你的API域名 \
LOAD_TEST_CONCURRENCY=50 \
LOAD_TEST_REQUESTS=1000 \
npm run loadtest:local
```

本地模板 AI 全链路写入压测（不会调用 DeepSeek）：

```bash
LOAD_TEST_BASE_URL=https://你的API域名 \
LOAD_TEST_CONCURRENCY=20 \
LOAD_TEST_REQUESTS=200 \
LOAD_TEST_AI=1 \
npm run loadtest:local
```

线上 DeepSeek 压测不要直接沿用上述数量，应按模型配额和成本单独制定额度。

## 监控建议

至少对以下指标设置告警：

- `/health` 连续失败。
- `/ready` 连续失败或返回 503（数据库不可查询）。
- API 5xx 比例异常。
- PostgreSQL / Redis 连接失败。
- `AI provider failed; local fallback used` 日志短时间快速增长。
- `/api/reviews/generate` 429 比例异常。
- 奖励领取失败率异常。

服务日志为结构化 JSON/Pino 日志，可交给云日志、ELK、Loki 等现有日志平台采集。

## 备份

Docker Compose 本地/单机部署：

```bash
./ops/backup-postgres.sh
```

生产数据库优先开启云数据库自动快照，并定期验证恢复流程。

## 回滚

1. 发布前记录当前运行镜像/版本号。
2. 数据库迁移前创建备份或快照。
3. 应用出现问题时先把流量切回上一稳定镜像。
4. 不直接执行破坏性数据库回滚；先判断新迁移是否向后兼容。
5. 如果必须恢复数据库，停止写流量后从上线前快照恢复，并核对 `ReviewSession`、`RewardRecord` 与 `PublishRecord` 一致性。
