# figma-overlay-check

[English](./README.md) | 中文

一个用于验证网页与 Figma 设计稿还原度的 [agent skill](https://agentskills.io)——叠图比对、DOM 与 Figma 坐标数字核对、量化像素 diff，全程不修改项目源码。

[![skills.sh](https://skills.sh/b/dengshangli/figma-overlay-check)](https://skills.sh/dengshangli/figma-overlay-check)

## 功能说明

1. 从 Figma 导出目标 Frame 为 PNG（自动处理 4096px 导出上限）
2. 对齐浏览器视口，并对页面总高度做体检
3. 通过 Playwright 在运行时把设计图注入为页面叠加层——`opacity: 0.5` 粗看整体错位，`mix-blend-mode: difference` 精查（"越黑越吻合"）
4. 用脚本自动定位的差异区域坐标 + 区域裁剪（`scripts/crop.mjs`）+ DOM 坐标测量快速定位差异根因
5. 用 pixelmatch 量化结果（`scripts/pixel-diff.mjs`）——自动对齐图片尺寸（Figma 导出缩放、Retina 截图），并按严重程度输出差异区域坐标；达标标准：mismatch < 2% 且无成片差异色块
6. 自动清理现场；叠加层只存在于运行时，绝不写入源码

技能里还内置了一张高频真实差异原因速查表（Figma 与 CSS 行高默认值差异、`object-cover` 裁切、border 盒模型等），让 agent 优先排查最可能的原因。

## 环境要求

- 可在本地跑起来的网页项目
- [Figma MCP](https://developers.figma.com/docs/figma-mcp-server/)（导出设计图、读取节点几何信息）
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)（驱动浏览器、注入叠加层）
- Node.js（脚本依赖 `pixelmatch` + `pngjs`，首次使用时安装）

## 安装

```bash
npx skills add dengshangli/figma-overlay-check
```

或安装到用户全局：

```bash
npx skills add dengshangli/figma-overlay-check -g
```

## 使用方式

直接对你的 agent 说：

- "检查这个页面和 Figma 设计稿的还原度"
- "对照这个 Figma frame 做一次 pixel-perfect 走查"
- "把设计稿叠到页面上，把差异修掉"

agent 会按照 [SKILL.md](./SKILL.md) 中的 6 步流程执行。

## 许可协议

[MIT](./LICENSE)
