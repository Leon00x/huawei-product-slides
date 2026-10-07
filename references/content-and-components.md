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

每页公共字段为 type/title/subtitle/eyebrow/section/footer。文字可为普通字符串或 zh/en 对象。普通字符串在两种语言中相同，适用于产品名、数值和英文缩写；中文说明需要双语对象。

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

## 高级示例代码 assets/recipes

这些是原演示中已经工作的实现，作为按需参考材料保存，不是默认依赖，也不是新产品内容来源。

- examples.html：MaaS 实时调用、代码索引、企业知识库、Agent Team、SDD/Vibe 实例、ChatBI 架构与项目 QR、运维场景的页面示例。
- index-demo.js / knowledge-demo.js：代码与知识检索流程组件。
- development-case.js：双列过程对比、spec/design/tasks、图表反馈与验收；保留暂停/重播/完整展示和生命周期。
- ops-demo.js：手动场景选择 + 编排流程轻量高亮，适合多场景 Demo；不自动轮换场景。
- presentation-scenes.js：场景调度、目录完整预览与项目 QR 弹窗。引入前检查所有选择器和 DOM 约定，避免与基础 scenes.js 的预览钩子互相覆盖。
- original-app.js：原模型价格卡片、峰谷价和输入/缓存输入/输出列的渲染参考。只提取需要的函数，不替换通用 app.js。
- maas-data.js / maas-stream.js / maas-console.js：旧模型数据、流式响应解析、实时 API 控制台。旧数据必须替换，不自动保留模型或价格。
- deploy/shared/maas-proxy.mjs：原流式 API 请求校验和代理。仅真实 API Demo 需要；若启用，在 worker 中经 PIN 检查后接入，并按新服务调整端点和参数限制。
- original-translations.js：原高级示例的双语文字参考。摘取实际复用的文案，替换旧产品内容。
- content.css / revision.css / english.css：高级组件原样式。摘取组件所需规则，避免把整个历史修订文件覆盖到新模板。
- assets/：可选的对应产品图标和场景图。

复杂示例含原业务文本和原选择器；迁移时核对 DOM、图片、字典、脚本加载顺序、场景钩子与打印逻辑。不能把参考文件直接整体加载就宣称跨产品复用完成。

真实 API Key 由演示者输入，不写入内容、源码、离线文件或部署配置。纯内容演示不需要 API 代理。示例来源和指标核对写入新项目内部 docs/content-sources.md。

## 可选封面背景

用户可以直接说“封面用云山”或“封面用金沙”。在 cover 页设置 `"background":"云山"` 或 `"background":"金沙"`。云山为层叠山脊与云海，金沙为沙丘远山；两张均保留左上方标题空间。未指定时沿用原山景，不修改现有在线 PPT。
