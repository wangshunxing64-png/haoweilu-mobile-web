# 中国大陆公网部署

1. 准备已备案的中国大陆域名、服务器和 HTTPS 证书；建议 H5 使用 `h5.example.cn`，API 使用 `api.example.cn`。
2. 复制 `.env.production.example` 为 `.env.production`，填入正式 API HTTPS 地址。`VITE_` 变量会进入浏览器包，禁止放密钥。
3. 执行 `npm ci && npm run verify`，将 `dist/` 同步到 `/var/www/haoweilu/`。
4. 按 `deploy/nginx.conf.example` 配置 Nginx，并把 CSP 的 API 域名替换为正式域名。
5. Backend 设置 `CORS_ORIGINS=https://h5.example.cn`，确认 PostgreSQL、AI Provider、备份和健康检查正常。
6. 二维码/NFC 使用 `https://h5.example.cn/?storeId=门店外部ID&merchantId=商户ID&scene=来源`。

上线命令示例：`rsync -av --delete dist/ /var/www/haoweilu/`，随后执行 `nginx -t`，成功后再重新加载 Nginx。旧 `miniapp/` 不受影响，可独立回滚。
