# 检查与交付

在新项目目录运行。基础运行不需要 npm 安装；浏览器检查需要 Playwright 和浏览器。

```sh
npm run build
npm test
python3 -m http.server 8798 --bind 127.0.0.1
# 另一个终端；端口被占用时选新端口并设置 DECK_URL
NODE_PATH=/path/to/existing/node_modules BROWSER_EXECUTABLE=/usr/bin/chromium \
DECK_URL=http://127.0.0.1:8798/index.html node tests/browser-check.cjs
```

没有已有 Playwright 时，`npm install --no-save playwright` 和 `npx playwright install chromium`，然后 `npm run test:browser`。Linux 的 NODE_PATH/BROWSER_EXECUTABLE 写法仅示例，Windows 使用其环境变量语法。

- 检查每页中文和英文，1600×1000、1366×768、390×844 视口；这里视口尺寸不是画布尺寸，画布始终 1600×900。
- 检查内容框宽度、实际文字边界和距页脚至少 8px。长英文卡片内部尤其需要截图人工查看；脚本不能代替所有视觉判断。
- 目录页数与实际 slides 相同，目录点击正确跳转，语言往返还原标题，页码和章节按实际内容生成。
- 工作流程支持播放/暂停/重播/完整示意，离开页面停止，打印和减少动态效果模式没有进行中的高亮。
- PIN 的匿名静态资源访问、错误 PIN、外站 Origin、合法 Cookie、篡改 Cookie、过期 Cookie和缺失 Secret 都有测试。
- 检查离线 HTML：CSS/JS/图片内嵌；不访问旧产品域名；双语和公共交互可用。
- 检查 Cloudflare 构建只复制静态资源，不暴露 worker、源码目录、测试或 Secret。
- 可选高级组件加入后，针对新增结构补充检查，特别是 SVG 长词、隐藏面板、缩略图和打印完整态。

交付包含项目源文件、内容输入、离线 HTML、内部来源记录和验证说明。PDF 不保留交互。skill 包不包含运行依赖、OAuth、Cloudflare account_id、访问 PIN、API Key、浏览器 Cookie 或原站点配置。
