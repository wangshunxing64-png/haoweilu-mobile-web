# Miniapp 与 Backend 对接说明

## 当前源码状态

现有小程序已经有远程 AI 请求接口，但以下能力仍主要在前端本地：

- 商户配置：`src/config/merchants.js`
- 会话：`src/core/review-session.js`
- 埋点：`src/services/analytics.js`
- 平台复制/跳转：`src/services/platform-publisher.js`
- AI 远程入口：`src/services/review-service.js`

因此后端采用“先兼容现有 AI 请求，再逐层服务端化”的方式，避免重做 Stitch UI。

## 最小接入：只切换 AI

在小程序商户 AI 配置中设置服务端 URL。`provider` / `model` 仍可保留以兼容现有前端结构，但服务端不会信任它们来决定真实模型：

```js
ai: {
  provider: "deepseek",
  endpoint: "http://localhost:3000/api/reviews/generate",
  model: "deepseek-v4-flash",
  fallbackToLocal: true,
}
```

DeepSeek Key 不进入小程序。真实 Provider 来自后端数据库中的 `Merchant.aiProvider`；首次 Seed 时由后端 `DEFAULT_AI_PROVIDER` 写入。

## 完整接入顺序

### 1. 扫码进入

调用：

```text
GET /api/merchants/liji?storeId=liji-main
```

用返回配置替换本地商户配置；网络失败时可保留当前本地配置作为 UI 兜底。

### 2. 开始体验

调用：

```text
POST /api/sessions
```

保存返回的 `session.id`。

### 3. 菜品 / 标签 / 补充内容

每一步可通过：

```text
PATCH /api/sessions/:id
```

服务端会再次验证菜品和标签是否属于当前商户，以及 5 道菜 / 120 字限制。

### 4. AI 生成

沿用当前 `review-service.js` 请求体，并增加 `sessionId`：

```json
{
  "provider": "deepseek",
  "model": "deepseek-v4-flash",
  "merchantId": "liji",
  "storeId": "liji-main",
  "sessionId": "...",
  "input": {
    "dishes": ["bone-soup"],
    "tags": ["broth"],
    "message": "汤底很香"
  }
}
```

### 5. 选评价

```text
POST /api/reviews/:reviewId/select
```

### 6. 选择平台

先：

```text
POST /api/publish/prepare
```

拿到评价文本和平台跳转参数，再执行现有复制/跳转逻辑。

### 7. 返回小程序后确认

完整奖励链路不能把“点击平台按钮”直接当作发布成功。应提供明确的“我已完成评价”动作，然后调用：

```text
POST /api/publish/complete
```

### 8. 领取奖励

```text
POST /api/rewards/claim
```

将返回的 6 位 `code` 显示在现有成功页福利卡中。

## 埋点映射

现有事件名可以直接沿用：

```text
scan_open
flow_step
flow_start
dish_toggle
tag_toggle
review_generated
review_selected
platform_clicked
reward_claimed
```

发送至：

```text
POST /api/events
```

不要把评价原文放进 `payload`；即便前端误传，后端仍会剔除 `message/content/text` 等字段。
