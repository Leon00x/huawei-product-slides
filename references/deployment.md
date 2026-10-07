# 构建与发布

## 不同交付方式

| 方式 | 命令 / 输出 | 用途 |
| --- | --- | --- |
| 本地网页 | npm run generate；python3 -m http.server | 验证布局和交互 |
| 离线单文件 | npm run build:offline → dist/offline/presentation.html | 转发、演示、无网络内容访问 |
| Cloudflare Worker | npm run build:cloudflare → deploy/cloudflare/dist/public | 受 PIN 保护的在线网页 |
| Sites ESM Worker | npm run build:sites → deploy/chatgpt-sites/dist/server/index.js | 支持 ESM Worker/Secret 的 Sites 宿主 |
| PDF | 浏览器打印，或浏览器检查的 qa/template.pdf | 静态阅读，所有动效节点完整显示 |

## Cloudflare 操作

1. 确认新项目目录、唯一 Worker 名称、是否需新域名。初始化自动把 --id 写入 wrangler.json 的 name，没有旧域名、旧 account_id 或路由。
2. 优先使用会话已有 Wrangler OAuth 或环境提供的授权。首次缺少授权时使用平台支持的 `npx wrangler login`；无浏览器云端用当前 Wrangler 支持的授权方式。不要把旧机器 OAuth 配置作为模板复制，也不要凭空假设已授权。
3. 在新项目执行 `npm run build`、`npm test` 和双语浏览器检查，先产出可审阅内容。
4. 设置新项目 `ACCESS_PIN`：`npx wrangler secret put ACCESS_PIN --config deploy/cloudflare/wrangler.json`。已有新项目 Secret 无需重设；未知 PIN 不能沿用猜测值。
5. 用户已经要求发布时：`npx wrangler deploy --config deploy/cloudflare/wrangler.json`。缺少发布授权时交付构建产物，后续审批针对具体项目和产物；不要反复请求已给出的授权。
6. 验证匿名访问显示 PIN 页、错误 PIN 被拒绝、已有合法 Cookie 能打开网页。仅有 OAuth 而没有 PIN 时，可以验证访问页和部署成功；明确说明完整登录后验收依赖 PIN，不声称已验证。
7. 返回部署工具报告的真实地址和版本 ID。自定义域名需要新域名配置 `{ "pattern":"new-domain.example", "custom_domain":true }`，必须确定是本次目标，不把 slides.maaslab.cloud 复制过去。

GitHub 自动部署使用新项目仓库和分支，构建命令 `npm run build:cloudflare`、部署命令 `npx wrangler deploy --config deploy/cloudflare/wrangler.json`。同一个 Worker 的更新保留已有 Secret。

## PIN 组件

代码来自原部署并有访问检查测试。Worker 先校验 PIN，再提供所有静态文件；缺少 ACCESS_PIN 返回 503。登录签发 HttpOnly/Secure/SameSite=Lax Cookie，有效 24 小时，HMAC 签名，改变 PIN 使旧 Cookie 失效。禁止通过前端隐藏 PIN 或哈希来替代服务端访问校验。

本地纯静态网页与离线 HTML 没有服务端 PIN；本地 Worker 测试需要私有 `.dev.vars`。这些区别要对使用者说清楚，不把离线交付误说成受 PIN 保护。

## Sites

构建器输出受 PIN 保护的内嵌 ESM Worker，不携带 `.openai/hosting.json`、站点 ID 或托管凭据。若当前环境有 Sites 工具，创建或打开用户指定的托管项目，按宿主要求提供入口和 ACCESS_PIN，保存版本并部署。没有相应工具时仍交付 ESM 产物，说明尚未发布；不要生成虚构的站点地址或配置。
