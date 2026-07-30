# 通用 Agent Skills README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将根 README 从 Codex 专用说明改为通用 Agent Skills 仓库文档，同时如实保留各 Skill 当前的平台依赖和限制。

**Architecture:** 只修改根目录 `README.md`。以 `skills` CLI 作为跨 Agent 的首选安装入口，以宿主工具 Skills 目录作为通用手动安装原则，并把 Codex 路径降级为平台示例；不修改任何 Skill 实现。

**Tech Stack:** Markdown、Git、`skills` CLI、npm registry metadata

## Global Constraints

- 只修改根目录 `README.md` 和本次设计/计划文档。
- 不修改任何 `SKILL.md`、脚本、资源或 Skill 行为。
- README 使用中文。
- 不把仓库描述为 Codex 专用。
- 不宣称所有 Skill 在所有 Agent 工具中均可无条件运行。
- 五个 Skill 的真实平台依赖必须如实保留。

---

### Task 1: 重构仓库定位与兼容性说明

**Files:**
- Modify: `README.md`
- Reference: `*/SKILL.md`

**Interfaces:**
- Consumes: 五个现有 Skill 的真实依赖。
- Produces: 面向多种 Agent 工具的仓库简介和兼容性说明。

- [ ] **Step 1: 修改标题和简介**

将标题改为：

```markdown
# Agent 工作流 Skills
```

简介说明：

- 仓库采用以 `SKILL.md` 为核心的 Agent Skills 结构。
- 可供支持 Agent Skills 或兼容 Skill 目录的智能 Agent 工具使用。
- 实际可用性取决于宿主是否提供对应浏览器、MCP、本地命令和登录环境。

- [ ] **Step 2: 新增兼容性说明**

在 Skill 总览后新增“兼容性说明”，明确：

| Skill | 当前运行条件 |
|---|---|
| `figma-overlay-check` | Figma MCP、Playwright MCP、Node.js |
| `wukong-email-template-generator` | Python 3；当前命令包含作者本机绝对路径，需按安装位置调整 |
| `email-template-compatibility-test` | 当前要求 Codex 应用内置浏览器 |
| `jingdouyun-email-template-replacement` | 当前要求 `chrome:control-chrome` 和已登录 Chrome |
| `crm-email-manual-send` | 当前要求 `chrome:control-chrome` 和已登录 Chrome |

在表格后说明：本仓库的文件格式是通用的，但单个 Skill 的工具依赖可能具有平台特性；本次仅调整文档定位，不重构实现。

- [ ] **Step 3: 调整正文中的 Codex 专属措辞**

将根 README 中：

- “面向 Codex”改为“面向智能 Agent”。
- “复制到 Codex”改为“复制到宿主工具的 Skills 目录”。
- “让 Codex 重新发现 Skill”改为“让宿主工具重新发现 Skill”。
- “让 Codex 选择 Skill”改为“让 Agent 选择 Skill”。

只在 Codex 安装示例和真实依赖说明中保留产品名。

### Task 2: 重写安装、更新和卸载说明

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: `skills` npm 包 1.5.21 的官方 README 和引擎要求。
- Produces: 通用 CLI 安装方法、通用手动安装原则和 Codex 平台示例。

- [ ] **Step 1: 写入 CLI 前置条件**

说明 `skills` CLI 当前版本要求 Node.js `>=22.20.0`，并提供检查命令：

```bash
node --version
```

- [ ] **Step 2: 写入通用 CLI 安装方式**

提供以下经过官方 README 确认的命令：

```bash
# 交互式选择仓库中的 Skill 和目标 Agent
npx skills add dengshangli/skills

# 安装指定 Skill
npx skills add dengshangli/skills --skill figma-overlay-check

# 安装全部 Skill 到所有检测到的 Agent
npx skills add dengshangli/skills --all

# 安装到用户级目录
npx skills add dengshangli/skills --skill figma-overlay-check --global
```

说明可通过 `--agent <agent-name>` 指定宿主，例如：

```bash
npx skills add dengshangli/skills --skill figma-overlay-check --agent codex
npx skills add dengshangli/skills --skill figma-overlay-check --agent claude-code
npx skills add dengshangli/skills --skill figma-overlay-check --agent cursor
```

- [ ] **Step 3: 保留通用手动安装**

将现有 Git clone 和复制循环改为通用说法：

- `SKILLS_DIR` 必须由用户根据宿主工具文档设置。
- 复制循环仍只复制包含顶层 `SKILL.md` 的目录。
- 不把 `${CODEX_HOME:-$HOME/.codex}/skills` 作为默认通用路径。

示例：

```bash
git clone https://github.com/dengshangli/skills.git
cd skills

SKILLS_DIR="/path/to/your-agent/skills"
mkdir -p "$SKILLS_DIR"
```

- [ ] **Step 4: 新增 Codex 平台示例**

单独加入：

```bash
SKILLS_DIR="${CODEX_HOME:-$HOME/.codex}/skills"
```

说明这是 Codex 的用户级目录示例；其他宿主应使用各自文档规定的项目级或用户级目录。

- [ ] **Step 5: 更新、验证和卸载**

优先介绍 CLI 命令：

```bash
npx skills list
npx skills update
npx skills remove figma-overlay-check
```

保留手动安装对应的 `git pull`、查找 `SKILL.md` 和谨慎删除目录说明，但将目录变量统一为用户自行设置的 `SKILLS_DIR`。

### Task 3: 验证范围和文档准确性

**Files:**
- Verify: `README.md`
- Verify unchanged: `*/SKILL.md`
- Verify unchanged: `*/scripts/**`

**Interfaces:**
- Consumes: Tasks 1–2 的 README 修改。
- Produces: 经过范围、链接和命令来源验证的文档提交。

- [ ] **Step 1: 验证 CLI 命令来源**

运行：

```bash
npm view skills@1.5.21 version engines repository.url --json
npm view skills@1.5.21 readme
```

确认 README 使用的 `add`、`--skill`、`--all`、`--global`、`--agent`、`list`、`update` 和 `remove` 与官方 README 一致。

当前本机 Node.js 为 `v20.10.0`，低于 CLI 要求的 `>=22.20.0`，因此不把当前环境中的 CLI 启动失败误判为文档命令错误；README 必须披露版本要求。

- [ ] **Step 2: 验证相对链接**

从根 README 提取所有 `(<path>/SKILL.md)` 链接并逐项运行 `test -f`。预期全部存在。

- [ ] **Step 3: 验证修改范围**

运行：

```bash
git diff --name-only master...HEAD
```

除本次 `docs/superpowers` 设计/计划文档外，只允许出现 `README.md`，不得出现任何 `SKILL.md`、脚本或资源文件。

- [ ] **Step 4: 检查 Markdown 和残留定位**

运行：

```bash
git diff --check
rg -n 'Codex 工作流 Skills|面向 Codex|复制到 Codex|让 Codex 重新发现|让 Codex 选择' README.md
```

预期：格式检查无输出，旧的 Codex 专用定位无匹配。Codex 仅出现在平台示例或真实依赖说明中。

- [ ] **Step 5: 提交并发布**

运行：

```bash
git add README.md
git commit -m "Generalize Agent Skills README"
```

完成验证后推送功能分支并按用户选择集成到 `master`。
