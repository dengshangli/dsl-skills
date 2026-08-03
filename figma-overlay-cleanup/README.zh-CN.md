# figma-overlay-cleanup

[English](./README.md) | 中文

## 简介

一个用于安全清理 `figma-overlay-check` 所保留 Figma 叠图的 Agent Skill。当前 v3 流程只移除主页中带标记的 import、一个临时叠图文件、一张设计图及记录产物，不会撤销 UI 还原修改。

## 清理内容

- v3 清单记录的单个临时叠图源码文件。
- 主页中由 `FIGMA_OVERLAY_START` / `FIGMA_OVERLAY_END` 包围的单条 import。
- 已记录的静态叠图图片，例如 `public/__figma_overlay__.png`。
- 已记录的设计稿下载文件和像素差异产物。
- 旧版 v1 清单记录的运行时叠图元素和样式。
- 所有其他清理完成后，删除临时的 `.figma-overlay-state.json` 状态清单。

该 Skill **不会**还原、重置或删除 UI 业务修改。

## 与 figma-overlay-check 的配合方式

1. `figma-overlay-check` 完成页面比对和修改，并保留叠图供用户肉眼复查。
2. 它在 `<项目根目录>/.figma-overlay-state.json` 中记录临时文件、图片和主页 import 的精确位置。
3. 用户检查完成后，明确要求删除叠图。
4. `figma-overlay-cleanup` 先移除主页 import，再删除临时文件、图片和产物，最后删除清单。

状态清单就是删除白名单。除非完全理解清理约定，否则不要手动创建或编辑该文件。

## 环境要求

- 已通过 `figma-overlay-check` 保留叠图。
- 目标项目根目录中存在有效的 `.figma-overlay-state.json`。
- 可以访问清单中记录的文件。
- 浏览器自动化能力，用于刷新并验证源码叠图或旧版运行时叠图已消失；页面不可用时会明确报告无法完成浏览器验证。

## 安装

当前 `skills` CLI 要求 Node.js `>=22.20.0`。

```bash
# 安装到用户级共享根目录 ~/.agents/skills/
npx skills add dengshangli/dsl-skills --global --agent universal --skill figma-overlay-cleanup
```

如需完整的叠图比对与清理流程，请同时安装 `figma-overlay-check`。

## 使用示例

- “删除叠图。”
- “移除刚才保留的 Figma overlay。”
- “清理叠图和下载的比对图片，但保留 UI 修改。”
- “Remove the preserved overlay from this project.”

如果在另一个或新打开的任务中执行清理，请同时提供目标项目路径，以便定位正确的状态清单。

## 安全保证

- 只有用户明确要求时才执行清理。
- 项目的规范化路径必须与状态清单一致。
- 只有清单记录的临时文件、图片、产物和主页 import 才允许删除或编辑。
- 禁止删除目录、使用通配符、递归删除、猜测路径或改动标记外的正常源码。
- 状态缺失或路径不安全时停止清理，不会扩大删除范围。
- 已经不存在的文件会被报告为“原本已不存在”，不会谎称已删除。

## 完整规则

状态校验、主页 import 移除、临时文件删除和浏览器验证流程，请查看 [SKILL.md](./SKILL.md)。

## 许可证

此 Skill 采用仓库根目录中的 [MIT License](../LICENSE)。
