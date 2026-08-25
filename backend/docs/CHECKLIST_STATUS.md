# 后端开发清单验收状态

本文件按用户提供的《AI 餐饮评价助手｜后端开发清单》逐项核对当前代码库。

## 1. 项目基础

- [x] 独立 `backend/` 工程：Node.js + TypeScript + Fastify
- [x] development / test / production 三套环境变量示例
- [x] `GET /health`
- [x] 统一结构化日志、业务错误码、Request ID 透传
- [x] CORS 白名单配置

## 2. 数据模型

Prisma / PostgreSQL 已建立并迁移以下 10 个核心模型：

- [x] Merchant
- [x] Store
- [x] Dish
- [x] ExperienceTag
- [x] PublishPlatform
- [x] ReviewSession
- [x] Review
- [x] PublishRecord
- [x] RewardRecord
- [x] AnalyticsEvent

## 3. 商户与门店接口

- [x] `GET /api/merchants/:merchantId`
- [x] 返回主题、文案、菜品、体验标签、平台配置
- [x] `merchantId` / `storeId` 扫码参数支持
- [x] 统一业务错误码，不暴露内部异常详情
- [x] “李记好味道”配置直接由现有小程序源码映射成 seed，保留原 dish/tag/platform ID

## 4. AI 评价生成

- [x] `POST /api/reviews/generate`
- [x] 请求体兼容现有 `review-service.js` 的 `provider/model/merchantId/input` 契约
- [x] 固定输出 3 条差异化评价
- [x] LocalFallbackProvider
- [x] DeepSeekProvider
- [x] QwenProvider 适配器预留
- [x] AI Key 仅从服务端环境变量读取
- [x] 菜品、标签、文字长度、空选择、可配置敏感词校验
- [x] Provider / 耗时 / 失败原因日志，禁止记录顾客原始 message
- [x] DeepSeek 异常自动回退 LocalFallback

## 5. 会话与评价记录

- [x] `POST /api/sessions`
- [x] `PATCH /api/sessions/:id`
- [x] `GET /api/sessions/:id`
- [x] `POST /api/reviews/:id/select`
- [x] 最终选择评价持久化，并支持保存顾客微调后的最终文本
- [x] 匿名会话
- [x] 数据模型预留 `openId` 后续绑定
- [x] 会话过期与定时清理

## 6. 发布与奖励

- [x] `POST /api/publish/prepare`
- [x] 返回最终评价文本和平台跳转参数
- [x] `POST /api/publish/complete`
- [x] 发布完成定义为“用户主动确认”，不伪造第三方平台审核/发布验证
- [x] `POST /api/rewards/claim`
- [x] 一次性 6 位核销码
- [x] 同一 session 重复领奖幂等：Redis / 内存幂等 + PostgreSQL unique constraint 双层保护

## 7. 埋点与统计

- [x] `POST /api/events`
- [x] 支持现有前端事件命名：`scan_open`、`flow_start`、`review_generated`、`review_selected`、`platform_clicked` 等
- [x] payload 敏感字段递归脱敏
- [x] 商户 / 门店 / 日期筛选
- [x] 后台漏斗统计
- [x] AI 生成次数统计
- [x] 各发布平台点击分布
- [x] Admin API Key 保护统计接口

## 8. 安全与质量

- [x] 全局入参校验
- [x] 全局限流
- [x] AI 生成接口专项限流
- [x] Redis 外部限流存储；Redis 故障时可退化
- [x] `Idempotency-Key`
- [x] Prisma schema + 初始化迁移 SQL + seed
- [x] 业务单元测试 / 领域测试
- [x] 完整链路测试逻辑：生成 → 选择 → 准备发布 → 用户确认 → 领奖
- [x] Swagger / OpenAPI，默认 `/docs`
- [x] PostgreSQL 备份脚本
- [x] 日志结构已支持接入生产日志/告警平台

## 9. 部署

### 已在代码库中准备

- [x] Dockerfile
- [x] docker-compose（API + PostgreSQL + Redis）
- [x] 生产环境变量模板
- [x] PostgreSQL migration deploy 脚本
- [x] 数据库备份脚本
- [x] 本地压测脚本
- [x] 部署与回滚说明

### 必须在真实服务器 / 平台账号完成

- [ ] HTTPS 正式域名与证书
- [ ] ICP 备案（如部署环境/业务域名依法需要）
- [ ] 正式 PostgreSQL 实例创建与备份策略落地
- [ ] 正式 Redis 实例
- [ ] 注入真实 DeepSeek API Key
- [ ] 接入实际日志收集、监控、异常告警平台
- [ ] 微信小程序后台配置合法 request 域名
- [ ] 在生产等价环境执行最终压测与回滚演练

## 当前验证状态（2026-08-17）

已验证：

- 后端领域测试：32 / 32 通过
- 后端 TypeScript 文件语法检查：通过
- 原小程序单元测试：8 / 8 通过

当前沙箱无法完成：

- Fastify API 注入测试
- Prisma typecheck
- 后端完整 build
- 小程序 H5 / mp-weixin build

原因不是已观察到的业务测试失败，而是当前运行环境无法解析 `registry.npmjs.org`，因此不能安装/修复 npm 依赖；后端缺少 Fastify/Prisma 本地包，原小程序现有 `node_modules` 又缺少 Rollup 的 Linux optional native package。

在可联网开发机上按 `backend/README.md` 的命令安装依赖后，应重新执行完整验收，不应把上述未执行项视作已经通过。
