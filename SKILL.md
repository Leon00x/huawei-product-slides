---
name: huawei-product-slides
description: Create or update Huawei-branded bilingual HTML product presentations using the bundled reusable canvas, Huawei logo, layouts, lightweight animations, presentation controls, PIN-protected hosting and Cloudflare deployment code. Use when the user wants slides matching this style, a new Huawei product deck, or reuse of the presentation template.
---

# 华为产品演示制作

用户提供产品内容，你负责组织页面、填充组件、检查双语排版、构建交付和按用户授权发布。默认复用这里的设计和基础代码。产物是可交互 HTML 演示、单文件离线 HTML、可打印 PDF 和可部署项目；不承诺生成可编辑的 `.pptx`。

## 工作方式

1. 第一次使用时告诉用户正在使用本 skill。读取 [设计规范](references/design.md)、[内容与组件](references/content-and-components.md)。需要发布时再读 [部署流程](references/deployment.md)。
2. 从上下文获取产品名、受众、核心信息、语言和现有素材。能合理推断就继续，不要要求用户配置 CSS、组件或构建。内容不完整时先做明确占位的草稿，不编造价格、指标、可用性或功能。
3. 新产品使用独立目录和唯一项目 ID。执行 `python3 <skill根目录>/scripts/init.py <新项目目录> --id <唯一slug> --title <产品标题> --starter blank`。`--starter blank` 提供封面＋空白内容页；需要组件示例时用 `--starter examples`。脚本复制完整可运行基础代码；不从原演示仓库动态下载依赖。更新已使用该 skill 的项目时继续其目录，不重新初始化覆盖文件。
4. 主要修改新项目 `content/deck.json`。以受众任务和客户价值组织内容，每页一个重点；选择合适的布局。生成文件 `index.html`、`js/config.js`、`js/translations.js` 会重建，业务内容不能直接写在它们里面。
5. 中英文用 `{ "zh": "中文", "en": "English" }`；英文表达允许调整句式以便阅读。公共骨架一致，英文样式在 `css/english.css` 单独适配。长文案先精简或拆页，不用过小字号压入方框。
6. 从模板现有组件开始；自定义内容使用 `custom` 片段。复杂交互需要时参考 `assets/recipes/`，示例仅包含通用占位内容。价格、指标、套餐容量和案例使用当前项目资料。按需引入控制器。
7. 执行 `npm run build` 和 `npm test`，通过本地 HTTP 服务运行 `npm run test:browser`。参考 [检查与交付](references/validation.md)，查看双语截图，修复文本超出、组件重叠和页脚距离。目录支持选择屏蔽页面并保存到当前浏览器，按项目 ID 隔离；所有翻页和章节跳转跳过屏蔽页，至少保留一页。页面 id 保持稳定，已有页面改标题或排序时不要修改 id。默认流程动效在进入页时运行，支持暂停、重播、完整显示；离页停止，目录与打印显示完整内容，尊重减少动态效果设置。
8. 交付项目和离线 HTML。用户要求发布且已有授权时，使用新项目的配置发布并验证访问页；没有部署要求时只构建可发布产物。复用已有认证，不复制账号配置、OAuth、访问 PIN 或 API Key 到包内。

## 设计默认值

- 华为 Logo 使用 `assets/template/assets/huawei-logo.png` 原图，保留比例，禁止重绘或变形。
- 可选封面：云山（层叠山脊与云海）、金沙（沙丘远山），在 cover 页的 background 字段选择。
- 1600×900 / 16:9，白底、华为红 `#c7000b`、深灰正文、细灰分割线，左右 84px 留白。
- 页头品牌与章节、标题/副标题、正文、页脚；控制条鼠标靠近底部或键盘操作时出现。
- 默认 2–4 张卡片、3–5 层架构、2 列比较、3–5 个流程节点。内容密集就拆页。
- 动效用于说明流程与因果。默认淡入和逐步高亮；不自动翻页，不自动轮换阅读中的场景，不增加复杂装饰动画。
- 新产品图标由当前项目提供；包内只保存通用品牌与封面素材。
- 用户是官方演示者时，不擅自添加“公开价格/核对日期/实际以购买页面为准”等模板声明。来源和核对日期写在内部 `docs/content-sources.md`，只保留用户需要呈现的规则、单位和适用范围。

## 输入与输出

用户可以直接给自然语言内容，不必自己填写 JSON。例如：

> 使用 $huawei-product-slides，介绍华为云的新产品 X，面向企业客户。内容包括定位、三项优势、架构、套餐、一个业务案例和 Demo。中英双语，沿用华为风格，部署到一个新的 Cloudflare 项目。

你将这些内容整理成 deck.json，生成并检查演示。常规页面只修改内容；新颖图示或真实 API Demo 可以扩展组件，同时保持公共交互和品牌规范。

交付时简要说明输出位置、页数、检查结果及已发布的地址。若只有构建产物，明确说明尚未发布。安装技能的方法和目录结构见 [README](README.md)。
