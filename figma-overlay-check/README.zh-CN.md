# figma-overlay-check

[English](./README.md) | 中文

## 简介

一个用于检查本地网页与 Figma 设计稿还原度的 Agent Skill。它会把持续挂载的叠图组件写入项目代码，并结合 DOM 与 Figma 坐标测量、数值颜色检查和量化像素差异完成比对。

## 功能

1. 将页面级 Figma Frame 导出为 PNG，并处理 Figma 4096 px 导出上限。
2. 对齐浏览器视口并检查页面总高度。
3. 在项目代码中加入可刷新保留的叠图，支持关闭、透明叠加和差值三种模式。
4. 通过差异区域、图片裁剪和 DOM 测量定位偏差。
5. 将渲染颜色与 Figma 数值对比，并支持感知色差 ΔE 采样。
6. 输出像素不匹配比例和按严重程度排序的差异区域。
7. 保留叠图代码和设计图供用户持续手动复查，直到运行清理技能。

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
- 叠图必须以独立模块或组件写入项目源码，并在目标路由持续挂载直到清理。
- 叠图应提供关闭、透明叠加、差值模式和透明度控制，刷新后仍可继续比较。
- 较低的像素差异比例不能证明颜色完全正确，还必须执行数值颜色检查。
- 动态内容、动画、Web 字体、视口尺寸、设备像素比和色彩配置都可能制造假差异。
- 只有用户明确要求修复时才能修改目标项目；仅要求检查时只授权读取和分析。
- 检查完成后会有意保留并持续挂载叠图源码和设计图，直到运行 `$figma-overlay-cleanup`。
- 技能会写入 `.figma-overlay-state.json`，精确记录专用叠图文件和带标记的接入代码块；复查后可调用 `$figma-overlay-cleanup` 安全移除。
- 比对专用代码默认不提交；只有用户明确要求时才提交到版本库。

## 完整规则

完整的七步工作流、代码叠图要求、通过标准、脚本用法和排错方法，请查看 [SKILL.md](./SKILL.md)。

## 许可证

此 Skill 采用仓库根目录中的 [MIT License](../LICENSE)。
