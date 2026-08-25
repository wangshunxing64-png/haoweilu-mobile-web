# 好味录·手机网页端

AI 餐饮真实评价助手的独立 H5 全栈项目，面向中国大陆手机浏览器。

## 项目结构

```text
.
├── h5-web/   # React + Vite 手机 H5
└── backend/  # Fastify + PostgreSQL + Prisma 后端
```

## 本地启动

```bash
cd backend
cp .env.development.example .env
npm install
npm run dev
```

```bash
cd h5-web
cp .env.example .env
npm install
npm run dev
```

H5 支持二维码参数：`storeId`、`merchantId`、`scene`。

## 生产环境

部署前请在服务器上单独配置环境变量、PostgreSQL、Redis、HTTPS 和 AI 服务密钥。不要将真实 `.env` 文件提交到仓库。
