# figma-overlay-check

[English](./README.md) | 中文

## 简介

把 Figma 设计稿叠加到本地网页上，检查视觉差异并自动完成一轮修正，然后等待用户指出剩余问题。确认完成后，可在页面右下角面板点击 `Delete Overlay`，删除叠图文件和入口引用。

## 功能

1. 将页面级 Figma Frame 导出为 PNG，并处理 Figma 4096 px 导出上限。
2. 对齐浏览器视口并检查页面总高度。
3. 创建一个刷新时由页面加载的临时叠图文件，严格按 Figma Frame 逻辑宽度渲染，主页只引入一次。
4. 通过差异区域、图片裁剪和 DOM 测量定位偏差，并由 AI 自动完成一轮修正。
5. 将渲染颜色与 Figma 数值对比，并支持感知色差 ΔE 采样。
6. 对比所需文件全部保存在 `.figma-overlay-check/` 中，后续通过 `Delete Overlay` 删除该目录。
7. 每次都注入同一份内置控制面板预置代码，其中包含红色 `Delete Overlay` 按钮及二次确认清理流程。

## 面板删除流程

最终目视确认完成后：

1. 点击展开面板底部的红色 `Delete Overlay` 按钮。
2. 确认 `Delete local overlay files and remove the page import? UI fixes will be kept.`。
3. 仅监听本机回环地址的 helper 校验清理清单和一次性令牌。
4. helper 只删除 `FIGMA_OVERLAY_START/END` import 标记块。
5. 如果技能为 Next.js App Router 入口添加了带标记的 `"use client"`，helper 会同时删除该标记块；原本存在的指令不会被删除。
6. helper 删除精确的 `.figma-overlay-check/` 目录并自动停止。
7. 页面自动刷新，叠图不再加载。

项目根目录 `.gitignore` 中的规则会保留，所有 UI 还原修改也会保留。helper 不可用时，让 AI 重启清理通道，再重新点击面板按钮。

## 生成文件布局

```text
<项目根目录>/
├── .gitignore                              # 包含 .figma-overlay-check/
├── .figma-overlay-check/
│   ├── .figma-overlay-state.json           # 清理清单
│   ├── __figma_overlay__.ts                # 唯一叠图源码文件
│   ├── design.png                          # 导出的 Figma Frame
│   └── ...                                 # 截图、差异图、裁剪图和依赖
└── <浏览器页面入口>                         # 包含一段带标记的副作用 import
```

## 适用场景

- 在设计验收前检查页面还原度。
- 排查布局、尺寸、间距、位置、字体或颜色偏差。
- UI 修复后复核视觉差异是否收敛。
- 用可测量证据代替主观目测。

## 环境要求

- 可以在本地运行的网页项目。
- [Figma MCP](https://developers.figma.com/docs/figma-mcp-server/)，用于导出设计稿和读取节点几何信息。
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) 或其他浏览器自动化能力，用于页面控制、截图和 DOM 测量。
- Node.js。随 Skill 提供的裁剪和颜色采样脚本会在需要时使用 `pngjs`。
- 在等效视口条件下获取的设计稿和页面截图。

## 安装

当前 `skills` CLI 要求 Node.js `>=22.20.0`。

```bash
# 安装到用户级共享根目录 ~/.agents/skills/
npx skills add dengshangli/dsl-skills --global --agent universal --skill figma-overlay-check
```

## 使用示例

- “检查这个页面和 Figma 设计稿的还原度。”
- “对照这个 Figma Frame 做一次 pixel-perfect 走查。”
- “把设计稿叠到页面上，找出最大的视觉偏差。”
- “测量页面的间距和颜色是否与设计一致。”

## 重要说明

- 每次只比较一个页面级 Frame，不要直接比较整个 Figma 画布。
- 所有生成文件（源码、图片、截图、差异图、依赖和清单）都必须放在 `<项目根目录>/.figma-overlay-check/` 中。
- 默认在项目根目录 `.gitignore` 中加入精确规则 `.figma-overlay-check/`；已有等效规则时不重复添加。
- 所有叠图 DOM、样式、控制器和状态必须放在一个临时文件中。
- 主页只能增加一段带 `FIGMA_OVERLAY_START/END` 标记的副作用 import，不能直接加入叠图组件或样式。
- 只有项目声明了 `next` 依赖，且入口位于该项目的 `app/` 或 `src/app/` 目录下时，才按 Next.js App Router 处理。此类入口没有 `"use client"` 时才添加单独标记的指令，清理时只删除该标记指令；普通项目和 Next.js Pages Router 都不会添加，原文件已有的指令也不会重复添加或删除。
- 叠图提供 `Hide Image`、`Opacity Overlay`、`Show Image` 三种英文按钮和 `Opacity` 透明度控制，其中 `Show Image` 内部使用差值模式；刷新后仍可继续比较。
- 展开面板默认距视口右侧和底部各 12 CSS px，宽度不超过 300 CSS px；使用更紧凑的字号、32–36 CSS px 高控件，内容过高时仅面板内部滚动。
- 面板 DOM、样式、文字、拖动、收起把手、测量信息和删除界面全部来自注入 `__figma_overlay__.ts` 的同一份内置模板；AI 不得在每次对比时重新设计。
- `Hide Image` 与 `Opacity Overlay` 位于首行两列，`Show Image` 在第二行横跨两列；面板仍可拖动并始终限制在视口内。
- 展开面板底部提供占满宽度的红色 `Delete Overlay` 按钮，并要求面板内二次确认；标题栏关闭按钮仍然只表示收起。
- 浏览器代码不会直接操作文件系统。技能自带的短生命周期 helper 仅监听 `127.0.0.1`，要求一次性令牌，校验清理清单后先删除带标记的 import，再删除精确的 `.figma-overlay-check/` 目录。
- helper 不可用或校验失败时，面板会显示错误并保留叠图。请让 AI 重启清理通道后再试。
- 面板所有可见文字必须使用英文；标题栏可拖动，关闭按钮只把面板收起为浏览器边缘的一小块无文字把手，不隐藏叠图图片，点击把手恢复完整面板。
- 收起把手不显示文字或图标，在视口内露出约 24 CSS px，外露侧使用圆角；位于右侧时需要计算浏览器垂直滚动条宽度，确保滚动条左侧仍有至少 16 CSS px 不受遮挡且可以点击。它使用固定定位，不占页面布局空间，并通过英文 `aria-label` 保持可访问性。
- 叠图图片宽度必须严格等于 Figma Frame 的逻辑宽度，不能使用 body、viewport、父容器、PNG 导出宽度、`100%` 或 `100vw` 代替。
- 必须从上到下遍历页面内可见元素，找到“源码中明确设置了固定宽度、实际渲染宽度也严格等于 Figma Frame 宽度”的页面级画布元素；body 或 viewport 只是碰巧同宽时不能作为目标。
- 叠图图片渲染后的左边和上边必须分别与目标页面画布的左边和上边完全对齐；不能居中，也不能通过 margin、padding 或 transform 产生偏移。
- 比对前必须用 `getBoundingClientRect()` 验证实际渲染宽度及左边/上边差值，每项误差均不得超过 0.1 CSS px。
- 叠图可用后，AI 自动完成一轮修正，再交给用户查看。
- AI 必须使用真实组件、HTML 和 CSS 实现页面，禁止把页面或整块区域替换成截图、Figma 导出图、背景图、canvas 或其他扁平图片；只有设计中本来就是图片的素材才允许使用图片。
- Skill 不计算或报告整页像素差异比例。AI 不会自动重复修正，剩余修改由用户指出。
- 需要精确确认颜色时再执行数值颜色检查。
- 动态内容、动画、Web 字体、视口尺寸、设备像素比和色彩配置都可能制造假差异。
- 正常调用本 Skill 包含 UI 修复；只有用户明确要求“仅检查/仅报告”时才不修改页面。
- AI 完成叠图问题修正后，必须明确提示用户在最终确认页面后点击面板中的 `Delete Overlay`，并确认危险操作。
- 面板删除流程先删除主页中带标记的 import，再删除 `.figma-overlay-check/` 及其中所有生成文件。
- `.figma-overlay-check/.figma-overlay-state.json` 会记录引用关系和生成产物，供面板删除时安全校验。
- 面板删除流程会保留 `.gitignore` 中的规则，供后续叠图比对继续使用。
- 比对专用代码默认不提交；只有用户明确要求时才提交到版本库。

## 完整规则

完整的单临时文件工作流、通过标准、脚本用法和面板删除约定，请查看 [SKILL.md](./SKILL.md)。

## 许可证

此 Skill 采用仓库根目录中的 [MIT License](../LICENSE)。
