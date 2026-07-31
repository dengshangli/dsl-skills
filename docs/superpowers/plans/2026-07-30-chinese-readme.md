# 中文 README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `dengshangli/dsl-skills` 仓库新增中文 README，准确介绍四个 Skill，并提供整库和单个 Skill 两种安装方式。

**Architecture:** 使用仓库根目录的单一 `README.md` 作为入口文档。README 通过相对链接连接各 Skill 的 `SKILL.md`，安装说明以 Codex 默认 Skill 目录 `${CODEX_HOME:-$HOME/.codex}/skills` 为目标，并使用普通 Git 克隆与 sparse-checkout 分别覆盖整库和单 Skill 安装。

**Tech Stack:** Markdown、Git、POSIX Shell、GitHub

## Global Constraints

- README 主要内容全部使用中文。
- 四个现有 Skill 均需包含用途、适用场景、关键依赖和调用示例。
- 同时介绍整库安装和单个 Skill 安装。
- 安装命令不得静默覆盖已有同名目录。
- CRM 或后台管理类 Skill 需要说明浏览器登录与明确操作授权。
- 所有说明必须以仓库当前文件和目录结构为准。

---

### Task 1: 编写中文 README

**Files:**
- Create: `README.md`
- Reference: `crm-email-manual-send/SKILL.md`
- Reference: `email-template-compatibility-test/SKILL.md`
- Reference: `jingdouyun-email-template-replacement/SKILL.md`
- Reference: `wukong-email-template-generator/SKILL.md`

**Interfaces:**
- Consumes: 四个 Skill 的 frontmatter、前置条件和工作流约束。
- Produces: 仓库根目录中文入口文档 `README.md`。

- [ ] **Step 1: 建立 README 标题、简介和 Skill 总览**

创建 `README.md`，依次写入：

1. 标题“Codex 邮件工作流 Skills”。
2. 一段说明仓库收录邮件生成、兼容性测试、后台模板替换和 CRM 手动发送 Skill。
3. 总览表，列出四个 Skill 的名称、用途、典型场景和浏览器/脚本依赖。
4. 每个 Skill 名称链接到对应的相对路径 `<skill-name>/SKILL.md`。

- [ ] **Step 2: 编写四个 Skill 的用途与调用示例**

每个 Skill 使用同一结构：

```markdown
### `<skill-name>`

**用途：** 一句话说明解决的问题。

**适用场景：**

- 场景一
- 场景二

**关键要求：** 浏览器、登录状态、脚本或操作授权要求。

**调用示例：**

> 一条用户可以直接对 Codex 说的中文请求。
```

内容必须覆盖：

- `wukong-email-template-generator`：使用固定悟空邮件外壳生成 HTML，必须执行仓库自带生成器。
- `email-template-compatibility-test`：通过应用内置浏览器批量发送本地 HTML 到测试邮箱，并区分服务器接受与实际送达。
- `jingdouyun-email-template-replacement`：通过已登录 Chrome 只替换筋斗云模板的“模板内容”字段。
- `crm-email-manual-send`：将本地文件名精确映射为 CRM 模板，逐封发送并核验跟进记录。

- [ ] **Step 3: 编写整库安装说明**

加入以下安全流程：

```bash
git clone https://github.com/dengshangli/dsl-skills.git
cd skills

SKILLS_DIR="${CODEX_HOME:-$HOME/.codex}/skills"
mkdir -p "$SKILLS_DIR"

for skill in */SKILL.md; do
  skill_dir="${skill%/SKILL.md}"
  if [ -e "$SKILLS_DIR/$skill_dir" ]; then
    echo "跳过已存在的目录：$SKILLS_DIR/$skill_dir"
  else
    cp -R "$skill_dir" "$SKILLS_DIR/"
  fi
done
```

解释该命令只复制包含顶层 `SKILL.md` 的 Skill 目录，不复制 `.git`、`docs` 和 README，也不会覆盖已有同名目录。

- [ ] **Step 4: 编写单个 Skill 安装说明**

以 `crm-email-manual-send` 为例加入：

```bash
git clone --filter=blob:none --no-checkout https://github.com/dengshangli/dsl-skills.git skills-single
cd skills-single
git sparse-checkout init --cone
git sparse-checkout set crm-email-manual-send
git checkout master

SKILLS_DIR="${CODEX_HOME:-$HOME/.codex}/skills"
mkdir -p "$SKILLS_DIR"
test ! -e "$SKILLS_DIR/crm-email-manual-send" &&
  cp -R crm-email-manual-send "$SKILLS_DIR/"
```

说明将命令中的 `crm-email-manual-send` 替换为其他目录名即可安装其他 Skill；目标已存在时命令不会覆盖。

- [ ] **Step 5: 编写更新、卸载、验证和注意事项**

加入：

- 更新：在克隆目录运行 `git pull`，确认差异后重新复制目标 Skill。
- 卸载：用户确认目录无自定义改动后删除 `${CODEX_HOME:-$HOME/.codex}/skills/<skill-name>`。
- 验证：运行 `find "${CODEX_HOME:-$HOME/.codex}/skills" -maxdepth 2 -name SKILL.md -print`。
- 注意：重启或新开 Codex 会话以重新发现 Skill；发送邮件、替换模板等写操作必须明确授权；需要浏览器的 Skill 必须使用已经登录的相应浏览器环境。

- [ ] **Step 6: 检查 README Markdown**

运行：

```bash
git diff --check
rg -n 'TBD|TODO|待补充|占位' README.md
```

预期：`git diff --check` 无输出；`rg` 无匹配。

- [ ] **Step 7: 提交 README**

```bash
git add README.md
git commit -m "Add Chinese skills README"
```

### Task 2: 验证文档引用和安装流程

**Files:**
- Verify: `README.md`
- Verify: `*/SKILL.md`

**Interfaces:**
- Consumes: Task 1 生成的 README 和仓库目录结构。
- Produces: 已验证、可发布的中文 README 提交。

- [ ] **Step 1: 验证 README 中列出的 Skill 集合**

运行：

```bash
for skill in crm-email-manual-send email-template-compatibility-test jingdouyun-email-template-replacement wukong-email-template-generator; do
  test -f "$skill/SKILL.md" || exit 1
  rg -q "$skill" README.md || exit 1
done
```

预期：退出码为 `0`。

- [ ] **Step 2: 验证相对链接目标**

从 README 中提取形如 `(<skill-name>/SKILL.md)` 的路径，并逐项运行 `test -f`。预期所有路径存在。

- [ ] **Step 3: 在临时目录验证整库安装命令的筛选逻辑**

创建系统临时目录作为 `SKILLS_DIR`，执行 README 中的循环，然后验证：

```bash
test -f "$SKILLS_DIR/crm-email-manual-send/SKILL.md"
test -f "$SKILLS_DIR/email-template-compatibility-test/SKILL.md"
test -f "$SKILLS_DIR/jingdouyun-email-template-replacement/SKILL.md"
test -f "$SKILLS_DIR/wukong-email-template-generator/SKILL.md"
test ! -e "$SKILLS_DIR/docs"
test ! -e "$SKILLS_DIR/.git"
```

预期：全部退出码为 `0`。测试结束后删除该临时目录。

- [ ] **Step 4: 最终检查并发布**

运行：

```bash
git status -sb
git diff master...HEAD --check
```

预期：工作区干净，差异检查无输出。随后推送 `agent/add-chinese-readme`，创建以 `master` 为目标的 PR；如用户再次明确要求直接合入，则确认检查状态后合并。
