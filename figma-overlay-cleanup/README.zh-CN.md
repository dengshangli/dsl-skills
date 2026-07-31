# figma-overlay-cleanup

[English](./README.md) | 中文

## 简介

一个用于安全清理 `figma-overlay-check` 所保留 Figma 叠图的 Agent Skill。它只移除运行时叠图和状态清单中记录的文件，不会撤销叠图比对过程中完成的任何 UI 还原修改。

## 清理内容

- 运行时叠图元素 `#__figma_overlay__`。
- 运行时专用样式 `#__figma_overlay_style__`。
- 已记录的静态叠图图片，例如 `public/__figma_overlay.png`。
- 已记录的设计稿下载文件和像素差异产物。
- 所有其他清理完成后，删除临时的 `.figma-overlay-state.json` 状态清单。

该 Skill **不会**还原、重置或删除 UI 业务修改。

## 与 figma-overlay-check 的配合方式

1. `figma-overlay-check` 完成页面比对和修改，并保留叠图供用户肉眼复查。
2. 它在 `<项目根目录>/.figma-overlay-state.json` 中记录叠图元素 ID 和产物的精确路径。
3. 用户检查完成后，明确要求删除叠图。
4. `figma-overlay-cleanup` 校验状态清单，移除运行时叠图，只删除清单记录的文件，最后删除清单本身。

状态清单就是删除白名单。除非完全理解清理约定，否则不要手动创建或编辑该文件。

## 环境要求

- 已通过 `figma-overlay-check` 保留叠图。
- 目标项目根目录中存在有效的 `.figma-overlay-state.json`。
- 可以访问清单中记录的文件。
- 如果运行时叠图仍在浏览器中，需要浏览器自动化能力。页面无法访问时仍可清理已验证的文件，但无法验证 DOM 是否已移除。

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
- 只有清单中记录的精确文件路径才允许删除。
- 禁止删除目录、使用通配符、递归删除、猜测路径或删除正常源码。
- 状态缺失或路径不安全时停止清理，不会扩大删除范围。
- 已经不存在的文件会被报告为“原本已不存在”，不会谎称已删除。

## 完整规则

状态校验、浏览器清理、文件删除和结果验证流程，请查看 [SKILL.md](./SKILL.md)。

## 许可证

此 Skill 采用仓库根目录中的 [MIT License](../LICENSE)。
