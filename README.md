# huawei-product-slides

可复用的华为风格产品演示 skill。包含实际基础代码、品牌素材、内容生成器、可选高级组件和发布流程。

```text
huawei-product-slides/
├── SKILL.md                 制作流程与 Agent 指令
├── references/              风格、内容格式、组件、部署、验证
├── scripts/init.py          创建独立演示项目
└── assets/
    ├── template/            可独立运行的基础项目
    └── recipes/             原 PPT 的高级组件参考代码
```

## 安装

将整个 huawei-product-slides 文件夹放入当前 Agent 支持的技能目录，保留 SKILL.md 和相对目录。Codex 用户级目录通常为 `$HOME/.agents/skills/huawei-product-slides/`；项目级可用 `<项目>/.agents/skills/huawei-product-slides/`，以当前客户端的技能发现方式为准。安装后重新载入会话并确认技能可见。本次交付是可安装包，没有自动写入全局技能目录。

## 使用

> 使用 $huawei-product-slides，帮我做产品 X 的介绍，沿用华为 Logo、排版和轻量动效。面向企业客户，内容如下……中英双语。

Agent 会整理内容、选择布局、生成演示并检查。只有内容变更时，修改 content/deck.json 即可；新图示或真实交互可扩展组件。

手动初始化：

```sh
python3 scripts/init.py /path/to/new-product-deck --id new-product-deck --title '产品 X 介绍' --title-en 'Product X briefing'
cd /path/to/new-product-deck
npm run build
```

可选封面素材已加入 **云山**（第一轮图二）和 **金沙**（沙漠背景），用户说名字即可选用。

基础包自带六页占位示例，体现封面、卡片、架构、对比、定价表和自动流程。不会自动继承当前 AI 演示的价格、产品指标或部署地址。

产物为 HTML 演示、离线单文件、可打印 PDF 与 Cloudflare/Sites 部署代码。部署授权和新项目访问 PIN 由当前会话提供；不把账号凭据打包。华为品牌图片来自当前用户仓库，随模板保存，资产来源见 ASSETS.md。
