# 通用 Agent Skills README 设计

## 目标

将仓库根目录 `README.md` 从 Codex 专用定位调整为通用 Agent Skills 仓库说明，使支持 Agent Skills、MCP、浏览器控制或本地脚本执行的不同 Agent 工具都能理解仓库用途和安装原则。

## 修改范围

仅修改根目录 `README.md`。不修改任何 `SKILL.md`、脚本、资源文件或 Skill 行为。

## 仓库定位

- 标题改为“Agent 工作流 Skills”。
- 简介说明这些 Skill 面向支持 Agent Skills 规范或兼容 `SKILL.md` 的智能 Agent 工具。
- 不承诺所有 Skill 可在所有宿主中无条件运行。
- 明确实际兼容性取决于宿主是否提供各 Skill 所需的 MCP、浏览器控制、本地命令和登录会话。

## 安装结构

安装章节按以下顺序组织：

1. 通过通用 Agent Skills 安装工具安装。
2. 手动安装到宿主工具的 Skills 目录。
3. 将 Codex 的 `${CODEX_HOME:-$HOME/.codex}/skills` 作为平台示例，而不是唯一默认目录。

通用安装命令优先介绍仓库支持的实际形式。执行实施前需验证 `npx skills add dengshangli/skills` 及单 Skill 路径的正确语法；若无法从权威工具帮助信息确认，不在 README 中写入未经验证的命令。

## 兼容性说明

README 新增兼容性说明：

- `figma-overlay-check` 需要 Figma MCP、Playwright MCP 和 Node.js。
- `wukong-email-template-generator` 需要 Python 3，且当前 `SKILL.md` 包含作者本机绝对安装路径，其他用户需要按自己的安装位置调整。
- `email-template-compatibility-test` 当前要求 Codex 应用内置浏览器。
- `jingdouyun-email-template-replacement` 和 `crm-email-manual-send` 当前要求对应的 Chrome 控制 Skill 及已登录会话。
- 上述限制只在文档中如实披露，不在本次修改中重构。

## 用语调整

将根 README 中以下 Codex 专属表述改为通用说法：

- “面向 Codex”改为“面向智能 Agent”。
- “复制到 Codex”改为“复制到宿主工具的 Skills 目录”。
- “重新启动 Codex”改为“重新启动宿主工具或新建会话”。
- “让 Codex 选择 Skill”改为“让 Agent 选择 Skill”。

Codex 的产品名仅保留在：

- Codex 平台安装示例。
- `email-template-compatibility-test` 的真实依赖说明。

## 验收标准

- 根 README 不再把仓库描述为 Codex 专用。
- 通用安装原则和 Codex 平台示例层次清楚。
- 五个 Skill 的真实依赖和当前平台限制均有说明。
- 所有安装命令经过语法或帮助信息验证。
- README 的相对链接均指向现有文件。
- 除根 README 和本设计流程文档外，不修改 Skill 内容。
