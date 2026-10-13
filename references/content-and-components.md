# 内容格式与组件

## 最少输入

从用户文字整理产品名称、面向对象、主要价值、能力、场景、所需页数和语言。用户只需提供内容；你负责把它转成模板数据。新产品选择新的 ID、目录和 Worker 名称。部署时使用会话中的已授权目标。

`content/deck.json`：

```json
{
  "id": "new-product-deck",
  "title": {"zh": "新产品介绍", "en": "New product briefing"},
  "brandLabel": "HUAWEI CLOUD",
  "footer": {"zh": "新产品 · 核心价值", "en": "New product · Core value"},
  "chapters": [
    {"label": {"zh": "概览", "en": "Overview"}, "section": {"zh": "产品概览", "en": "Product overview"}}
  ],
  "slides": [
    {
      "type": "cards",
      "section": {"zh": "产品概览", "en": "Product overview"},
      "title": {"zh": "客户为什么选择它", "en": "Why customers choose it"},
      "subtitle": {"zh": "围绕客户任务描述价值", "en": "Describe value through customer tasks"},
      "cards": [
        {"title": {"zh": "价值一", "en": "Value one"}, "body": {"zh": "具体业务结果", "en": "A concrete business outcome"}},
        {"title": {"zh": "价值二", "en": "Value two"}, "body": {"zh": "具体体验改善", "en": "A concrete experience improvement"}}
      ]
    }
  ]
}
```

章节的 section 值必须与页面的 section 对应。页码、目录、链接边界和页数按实际 slide 自动计算；生成脚本不把旧项目页数复制进来。

## 常规组件字段

每页公共字段为 id/type/title/subtitle/eyebrow/section/footer。id 为稳定且唯一的小写 slug；省略时生成器会自动分配并写回 deck.json，后续改标题或排序时保留它。文字可为普通字符串或 zh/en 对象。普通字符串在两种语言中相同，适用于产品名、数值和英文缩写；中文说明需要双语对象。

| 类型 | 内容字段 | 容量和用途 |
| --- | --- | --- |
| cover | title, eyebrow, subtitle, tagline, background | 产品名称 + 一句话定位；background 可选云山、金沙、原山景 |
| cards | cards: [{title, body}] | 2–4 个价值或能力 |
| metrics | metrics: [{value, label, body}] | 2–4 个面向客户的指标，写明单位和条件 |
| architecture | layers: [{label, items: [文字]}] | 3–5 层，每层 1–4 个模块 |
| comparison | columns: [{kicker, title, summary, bullets}] | 2 列，每列 1–4 项，比较相同维度 |
| table | headers: [文字], rows: [[文字]], note | 2–6 列、1–6 行；套餐、容量、价格或对照 |
| workflow | steps: [{title, body}], result | 3–5 步，自动轻量高亮 |
| image | image, alt, caption, body | 本地 assets 图片 + 说明；不裁切产品图 |
| custom | fragment, translations | content/name.html 片段，扩展架构或互动页面 |

数据大小上限用于控制信息密度；短文本可使用上限，长文本仍需要拆页和实测。所有普通文本经过 HTML 转义，不会作为代码执行。

双语字典按中文字符串映射，某个相同中文需要两种不同译法时，改成更明确的中文或创建自定义组件；生成器遇到冲突会提示，不静默覆盖。用户输入框和 `data-no-translate` 内容不会被翻译。自定义片段的 translations 按完整文本节点匹配，例如“输入 → 输出”要提供该完整字符串的译文。

## 自定义组件

把正文片段写在 `content/new-diagram.html`。片段只包含正文，页头、标题、目录和页脚继续由模板生成。使用新样式类放在 components.css 或单独 CSS；新增脚本在 shell.html 明确引入，构建器会自动收集本地脚本和样式。通过 custom 页的 translations 字段补充中文字典：

```json
{"type":"custom","title":{"zh":"自定义图示","en":"Custom diagram"},"fragment":"content/new-diagram.html","translations":{"某节点":"A node"}}
```

## 可选组件 assets/recipes

全部业务内容由当前项目提供，包内没有模型清单、价格、套餐容量、性能指标或旧项目二维码。

- examples.html：通用定价容器、步骤流程和手动场景切换的 DOM 示例；所有正文都是占位文字。
- pricing-table.js：调用 `DeckPricing.render(container, rows, labels)`。rows 使用 name/input/cacheInput/output；有缓存输入时在 input 右侧增加同字号列，没有缓存输入时省略该列。数值和单位由调用者提供，缺失值显示破折号。
- scene-controller.js：步骤高亮、暂停、重播、完整显示、离页停止、减少动态效果和打印完整展示。与模板 js/scenes.js 使用相同契约，只加载其中一个。可用于代码检索、知识检索、角色协作和双列案例，具体步骤来自当前内容。
- scenario-switcher.js：按 data-ops-choice/data-ops-panel 对应值手动切换场景，不自动轮换；流程动效另用 scene-controller.js。
- recipes.css：通用价格表和场景切换样式；基础流程样式仍来自模板 components.css。
- maas-stream.js / maas-console.js / deploy/shared/maas-proxy.mjs：可选的华为云 OpenAI 兼容流式 API 集成。没有默认模型、价格或 API Key；保留官方端点白名单。纯内容演示无需加载。启用时补全控制台 DOM、双语文字，并在 Worker 中经 PIN 检查后接入代理。

真实 API Key 由演示者输入，不写入源码、内容、离线文件或部署配置。内部来源与核对记录写入新项目 docs/content-sources.md。

## 可选封面背景

用户可以直接说“封面用云山”或“封面用金沙”。在 cover 页设置 `"background":"云山"` 或 `"background":"金沙"`。云山为层叠山脊与云海，金沙为沙丘远山；两张均保留左上方标题空间。未指定时沿用原山景，不修改现有在线 PPT。

## 演示页面选择

目录 → 屏蔽页面 → 勾选 → 保存。只保存当前项目的页面 ID 到浏览器本地；键为 `<项目id>-hidden-pages-v1`。刷新及同源标签页继续生效，其他项目、浏览器、设备和域名独立。至少保留一页；取消或关闭目录放弃草稿。屏蔽页仍在目录中，支持恢复全部。导航、章节跳转和当前浏览器打印跳过屏蔽页，原稿页码保留。
