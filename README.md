# huawei-product-slides

可复用的华为风格产品演示 skill。包含实际基础代码、品牌素材、内容生成器、可选高级组件和发布流程。

```text
huawei-product-slides/
├── SKILL.md                 制作流程与 Agent 指令
├── references/              风格、内容格式、组件、部署、验证
├── scripts/init.py          创建独立演示项目
└── assets/
    ├── template/            可独立运行的基础项目
    └── recipes/             通用交互、定价表与 API 集成参考代码
```

## 安装

将整个 huawei-product-slides 文件夹放入当前 Agent 支持的技能目录，保留 SKILL.md 和相对目录。Codex 用户级目录通常为 `$HOME/.agents/skills/huawei-product-slides/`；项目级可用 `<项目>/.agents/skills/huawei-product-slides/`，以当前客户端的技能发现方式为准。安装后重新载入会话并确认技能可见。本次交付是可安装包，没有自动写入全局技能目录。

## 使用

> 使用 $huawei-product-slides，帮我做产品 X 的介绍，沿用华为 Logo、排版和轻量动效。面向企业客户，内容如下……中英双语。

Agent 会整理内容、选择布局、生成演示并检查。只有内容变更时，修改 content/deck.json 即可；新图示或真实交互可扩展组件。

手动初始化：

```sh
python3 scripts/init.py /path/to/new-product-deck --id new-product-deck --title '产品 X 介绍' --title-en 'Product X briefing' --starter blank
cd /path/to/new-product-deck
npm run build
```

可选封面素材已加入 **云山**（第一轮图二）和 **金沙**（沙漠背景），用户说名字即可选用。

基础包自带六页占位示例，体现封面、卡片、架构、对比、定价表和自动流程。不会自动继承当前 AI 演示的价格、产品指标或部署地址。

产物为 HTML 演示、离线单文件、可打印 PDF 与 Cloudflare/Sites 部署代码。部署授权和新项目访问 PIN 由当前会话提供；不把账号凭据打包。华为品牌图片来自当前用户仓库，随模板保存，资产来源见 ASSETS.md。

可选组件也不包含原演示的模型价格、套餐容量、性能指标、业务翻译字典或项目二维码。真实 API 控制台与代理保留为可选华为云集成，不包含模型、端点默认值或 Key。

## 可直接打开的两页 Demo

在线预览：[封面＋空白页](https://huawei-product-slides-demo.leonguo08.workers.dev/)。

`demo/index.html` 是完整离线网页：云山封面＋空白内容页，保留翻页、目录、全屏和中英切换。双击即可打开，不需要安装依赖。空白页只有品牌、页标题和页脚，正文没有占位方框。

`--starter blank` 创建相同结构的可编辑项目；默认 `--starter examples` 保留六页组件示例。新增内容可修改 deck.json 或 content/blank.html。

重新生成 Demo：`python3 scripts/build-demo.py`。演示站只发布这两页通用模板，不包含业务内容；正式产品部署继续使用模板内的 PIN 门禁。
