# figma-overlay-check

[English](./README.md) | 中文

## 简介

一个用于检查本地网页与 Figma 设计稿还原度的 Agent Skill。所有叠图逻辑都放在一个临时源码文件中，主页只增加一条带标记的 import，便于复查后完整移除。

## 功能

1. 将页面级 Figma Frame 导出为 PNG，并处理 Figma 4096 px 导出上限。
2. 对齐浏览器视口并检查页面总高度。
3. 创建一个刷新时由页面加载的临时叠图文件，严格按 Figma Frame 逻辑宽度渲染，主页只引入一次。
4. 通过差异区域、图片裁剪和 DOM 测量定位偏差，并由 AI 主动修改页面。
5. 将渲染颜色与 Figma 数值对比，并支持感知色差 ΔE 采样。
6. 输出像素不匹配比例和按严重程度排序的差异区域。
7. 反复执行“比对—修改—刷新—量化”，收敛后再交给用户确认，并用 v3 清单保留叠图到清理阶段。

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
- 所有叠图 DOM、样式、控制器和状态必须放在一个临时文件中。
- 主页只能增加一段带 `FIGMA_OVERLAY_START/END` 标记的副作用 import，不能直接加入叠图组件或样式。
- 叠图提供 `Hide Image`、`Opacity Overlay`、`Show Image` 三种英文按钮和 `Opacity` 透明度控制，其中 `Show Image` 内部使用差值模式；刷新后仍可继续比较。
- 面板所有可见文字必须使用英文；标题栏可拖动，关闭按钮只把面板收起为浏览器边缘的一小块无文字把手，不隐藏叠图图片，点击把手恢复完整面板。
- 收起把手不显示文字或图标，只在视口内露出约 12–16 CSS px，外露侧使用圆角；它使用固定定位，不占页面布局空间，并通过英文 `aria-label` 保持可访问性。
- 叠图图片宽度必须严格等于 Figma Frame 的逻辑宽度，不能使用 body、viewport、父容器、PNG 导出宽度、`100%` 或 `100vw` 代替。
- 必须从上到下遍历页面内可见元素，找到“源码中明确设置了固定宽度、实际渲染宽度也严格等于 Figma Frame 宽度”的页面级画布元素；body 或 viewport 只是碰巧同宽时不能作为目标。
- 叠图图片渲染后的左边和上边必须分别与目标页面画布的左边和上边完全对齐；不能居中，也不能通过 margin、padding 或 transform 产生偏移。
- 比对前必须用 `getBoundingClientRect()` 验证实际渲染宽度及左边/上边差值，每项误差均不得超过 0.1 CSS px。
- 叠图可用后，AI 必须先根据差异主动调整页面并循环复查，不能立刻要求用户确认。
- 只有达到通过标准，或剩余差异都已量化并说明后，才进入用户最终确认。
- 较低的像素差异比例不能证明颜色完全正确，还必须执行数值颜色检查。
- 动态内容、动画、Web 字体、视口尺寸、设备像素比和色彩配置都可能制造假差异。
- 正常调用本 Skill 包含 UI 修复；只有用户明确要求“仅检查/仅报告”时才不修改页面。
- AI 完成叠图问题修正后，必须明确提示用户在最终确认页面后调用 `$figma-overlay-cleanup` 删除叠图。
- 检查完成后会保留临时文件、图片和主页 import，直到运行 `$figma-overlay-cleanup`。
- `.figma-overlay-state.json` 会精确记录这三项；清理时只移除它们和比对产物。
- 不要把叠图相关临时文件或路径添加到 `.gitignore`，也不要为此修改 `.gitignore`；后续统一由 `$figma-overlay-cleanup` 删除。
- 比对专用代码默认不提交；只有用户明确要求时才提交到版本库。

## 完整规则

完整的单临时文件工作流、通过标准、脚本用法和清理约定，请查看 [SKILL.md](./SKILL.md)。

## 许可证

此 Skill 采用仓库根目录中的 [MIT License](../LICENSE)。
