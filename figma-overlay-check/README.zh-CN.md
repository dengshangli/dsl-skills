# figma-overlay-check

[English](./README.md) | 中文

## 简介

一个用于检查本地网页与 Figma 设计稿还原度的 Agent Skill。所有生成文件都放在 `.figma-overlay-check/` 中，默认把该目录加入项目 `.gitignore`，主页只增加一条带标记的 import，便于复查后安全清理。

## 功能

1. 将页面级 Figma Frame 导出为 PNG，并处理 Figma 4096 px 导出上限。
2. 对齐浏览器视口并检查页面总高度。
3. 创建一个刷新时由页面加载的临时叠图文件，严格按 Figma Frame 逻辑宽度渲染，主页只引入一次。
4. 通过差异区域、图片裁剪和 DOM 测量定位偏差，并由 AI 主动修改页面。
5. 将渲染颜色与 Figma 数值对比，并支持感知色差 ΔE 采样。
6. 输出像素不匹配比例和按严重程度排序的差异区域。
7. 反复执行“比对—修改—刷新—量化”，收敛后再交给用户确认，并把 v4 清理状态清单保存在 `.figma-overlay-check/` 中。
8. 在面板底部增加红色“删除叠图”操作，通过仅监听本机回环地址的 helper，在二次确认后删除入口引用和生成目录。
9. 面板默认采用右下角紧凑布局，尽量减少对页面内容的遮挡。

## 面板删除流程

不需要安装或调用独立的清理 Skill。最终目视确认完成后：

1. 点击展开面板底部的红色 `Delete Overlay` 按钮。
2. 确认 `Delete local overlay files and remove the page import? UI fixes will be kept.`。
3. 仅监听本机回环地址的 helper 校验 v4 清单和一次性令牌。
4. helper 只删除 `FIGMA_OVERLAY_START/END` import 标记块。
5. helper 删除精确的 `.figma-overlay-check/` 目录并自动停止。
6. 页面自动刷新，叠图不再加载。

项目根目录 `.gitignore` 中的规则会保留，所有 UI 还原修改也会保留。helper 不可用时，让 Codex 重启清理通道，再重新点击面板按钮。

## 生成文件布局

```text
<项目根目录>/
├── .gitignore                              # 包含 .figma-overlay-check/
├── .figma-overlay-check/
│   ├── .figma-overlay-state.json           # v4 清理清单
│   ├── __figma_overlay__.ts                # 唯一叠图源码文件
│   ├── design.png                          # 导出的 Figma Frame
│   └── ...                                 # 截图、差异图、裁剪图和依赖
└── <浏览器页面入口>                         # 包含一段带标记的副作用 import
```

不会在 `src/`、`public/`、`/tmp` 或其他项目路径生成叠图文件。项目根目录 `.gitignore` 会以幂等方式加入一条 `.figma-overlay-check/` 规则。

## 适用场景

- 在设计验收前检查页面还原度。
- 排查布局、尺寸、间距、位置、字体或颜色偏差。
- UI 修复后复核视觉差异是否收敛。
- 用可测量证据代替主观目测。

## 环境要求

- 可以在本地运行的网页项目。
- [Figma MCP](https://developers.figma.com/docs/figma-mcp-server/)，用于导出设计稿和读取节点几何信息。
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) 或其他浏览器自动化能力，用于页面控制、截图和 DOM 测量。
- Node.js。随 Skill 提供的图片脚本会在需要时使用 `pixelmatch` 和 `pngjs`。
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
- 叠图提供 `Hide Image`、`Opacity Overlay`、`Show Image` 三种英文按钮和 `Opacity` 透明度控制，其中 `Show Image` 内部使用差值模式；刷新后仍可继续比较。
- 展开面板默认距视口右侧和底部各 12 CSS px，宽度不超过 300 CSS px；使用更紧凑的字号、32–36 CSS px 高控件，内容过高时仅面板内部滚动。
- `Hide Image` 与 `Opacity Overlay` 位于首行两列，`Show Image` 在第二行横跨两列；面板仍可拖动并始终限制在视口内。
- 展开面板底部提供占满宽度的红色 `Delete Overlay` 按钮，并要求面板内二次确认；标题栏关闭按钮仍然只表示收起。
- 浏览器代码不会直接操作文件系统。技能自带的短生命周期 helper 仅监听 `127.0.0.1`，要求一次性令牌，校验 v4 清单后先删除带标记的 import，再删除精确的 `.figma-overlay-check/` 目录。
- helper 不可用或校验失败时，面板会显示错误并保留叠图。请让 Codex 重启清理通道后再试。
- 面板所有可见文字必须使用英文；标题栏可拖动，关闭按钮只把面板收起为浏览器边缘的一小块无文字把手，不隐藏叠图图片，点击把手恢复完整面板。
- 收起把手不显示文字或图标，在视口内露出约 24 CSS px，外露侧使用圆角；位于右侧时需要计算浏览器垂直滚动条宽度，确保滚动条左侧仍有至少 16 CSS px 不受遮挡且可以点击。它使用固定定位，不占页面布局空间，并通过英文 `aria-label` 保持可访问性。
- 叠图图片宽度必须严格等于 Figma Frame 的逻辑宽度，不能使用 body、viewport、父容器、PNG 导出宽度、`100%` 或 `100vw` 代替。
- 必须从上到下遍历页面内可见元素，找到“源码中明确设置了固定宽度、实际渲染宽度也严格等于 Figma Frame 宽度”的页面级画布元素；body 或 viewport 只是碰巧同宽时不能作为目标。
- 叠图图片渲染后的左边和上边必须分别与目标页面画布的左边和上边完全对齐；不能居中，也不能通过 margin、padding 或 transform 产生偏移。
- 比对前必须用 `getBoundingClientRect()` 验证实际渲染宽度及左边/上边差值，每项误差均不得超过 0.1 CSS px。
- 叠图可用后，AI 必须先根据差异主动调整页面并循环复查，不能立刻要求用户确认。
- 只有达到通过标准，或剩余差异都已量化并说明后，才进入用户最终确认。
- 较低的像素差异比例不能证明颜色完全正确，还必须执行数值颜色检查。
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
