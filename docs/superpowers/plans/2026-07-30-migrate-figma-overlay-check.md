# Figma Overlay Check 迁移 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `dengshangli/figma-overlay-check` 的全部文件和 3 个提交历史迁入 `dengshangli/skills/figma-overlay-check/`，更新中文 README，并在远端迁移验证通过后彻底删除源仓库。

**Architecture:** 使用非 squash 的 `git subtree add` 将源仓库 `main` 历史合并到目标功能分支，使源提交继续存在于目标提交图中。迁移文件和 README 先进入目标仓库 `master`，再通过 GitHub API 核对远端树、提交历史和公开状态；删除源仓库是最后一个独立阶段。

**Tech Stack:** Git、Git subtree、GitHub CLI、Markdown、Node.js 语法检查

## Global Constraints

- 目标目录固定为 `figma-overlay-check/`。
- 源仓库 `main` 中的受版本控制文件必须逐文件原样迁移。
- 不使用 `git subtree --squash`。
- 根 README 使用中文介绍迁入的 Skill。
- 删除源仓库前必须验证目标仓库远端 `master` 已包含全部文件和源提交历史。
- 删除目标必须精确为 `dengshangli/figma-overlay-check`。
- 任一迁移或验证步骤失败时停止，不删除源仓库。

---

### Task 1: 导入源仓库文件和完整历史

**Files:**
- Create: `figma-overlay-check/LICENSE`
- Create: `figma-overlay-check/README.md`
- Create: `figma-overlay-check/README.zh-CN.md`
- Create: `figma-overlay-check/SKILL.md`
- Create: `figma-overlay-check/scripts/amplify.mjs`
- Create: `figma-overlay-check/scripts/color-sample.mjs`
- Create: `figma-overlay-check/scripts/crop.mjs`
- Create: `figma-overlay-check/scripts/pixel-diff.mjs`

**Interfaces:**
- Consumes: `dengshangli/figma-overlay-check` 的 `main` 分支。
- Produces: 当前功能分支中的 `figma-overlay-check/` 目录和可追溯的源提交历史。

- [ ] **Step 1: 记录源仓库状态**

运行：

```bash
gh repo view dengshangli/figma-overlay-check \
  --json nameWithOwner,visibility,defaultBranchRef,url
gh api 'repos/dengshangli/figma-overlay-check/commits?per_page=100' \
  --jq '.[].sha'
gh api 'repos/dengshangli/figma-overlay-check/git/trees/main?recursive=1' \
  --jq '.tree[] | select(.type=="blob") | [.path,.sha] | @tsv'
```

预期：仓库为 `PUBLIC`，默认分支为 `main`，提交数为 3，文件清单与设计规格一致。保存源分支 tip SHA 用于后续历史验证。

- [ ] **Step 2: 添加临时 remote 并获取源历史**

运行：

```bash
git remote add figma-overlay-source https://github.com/dengshangli/figma-overlay-check.git
git fetch figma-overlay-source main
```

预期：`figma-overlay-source/main` 指向 Step 1 记录的源分支 tip SHA。

- [ ] **Step 3: 使用 subtree 导入完整历史**

运行：

```bash
git subtree add \
  --prefix=figma-overlay-check \
  figma-overlay-source main \
  -m "Migrate figma overlay check skill"
```

不得添加 `--squash`。预期：目标目录包含全部 8 个文件，subtree 合并提交的父历史包含源分支 tip。

- [ ] **Step 4: 验证文件一致性和历史**

运行：

```bash
source_tip="$(git rev-parse figma-overlay-source/main)"
git merge-base --is-ancestor "$source_tip" HEAD

source_tree="$(mktemp -d)"
git archive figma-overlay-source/main | tar -x -C "$source_tree"
diff -ru "$source_tree" figma-overlay-check
rm -r "$source_tree"
```

预期：祖先检查退出码为 `0`，目录比较无差异。

- [ ] **Step 5: 检查脚本语法**

运行：

```bash
for script in figma-overlay-check/scripts/*.mjs; do
  node --check "$script"
done
```

预期：4 个脚本全部退出码为 `0`。本仓库没有提供 `package.json` 或测试夹具，因此不运行依赖图像输入的功能测试。

### Task 2: 更新根 README

**Files:**
- Modify: `README.md`
- Reference: `figma-overlay-check/SKILL.md`

**Interfaces:**
- Consumes: Task 1 迁入的 Skill 内容。
- Produces: 包含第五个 Skill 介绍和安装目录名的中文根 README。

- [ ] **Step 1: 读取 Skill 约束**

完整读取 `figma-overlay-check/SKILL.md`、`figma-overlay-check/README.md` 和 `figma-overlay-check/README.zh-CN.md`，确认用途、输入、输出、脚本依赖与典型工作流。

- [ ] **Step 2: 更新 Skill 总览**

在根 README 的 Skill 总览表新增：

```markdown
| [`figma-overlay-check`](figma-overlay-check/SKILL.md) | 将实现页面截图与 Figma 设计稿进行叠加和像素差异分析 | 定位布局、尺寸、位置和颜色偏差 | Figma 截图、实现截图、Node.js 图像处理脚本 |
```

- [ ] **Step 3: 新增详细中文介绍**

在“各 Skill 介绍”中加入：

```markdown
### `figma-overlay-check`

**用途：** 通过半透明叠加、像素差异和颜色采样，对比实现页面截图与 Figma 设计稿，定位视觉偏差。

**适用场景：**

- 验收前端页面与 Figma 设计稿的还原度。
- 排查布局、尺寸、间距、位置和颜色不一致。
- 在修改 UI 后使用相同截图条件复核偏差是否收敛。

**关键要求：** 需要同视口、同尺寸的设计稿与实现截图；按 Skill 规定的顺序使用裁剪、叠加、像素差异和颜色采样脚本，并以测量结果而非目测猜测定位问题。

**调用示例：**

> 对比这张 Figma 设计稿和当前页面截图，找出主要视觉偏差并给出修正建议。
```

- [ ] **Step 4: 更新单 Skill 安装清单**

在可安装目录名列表中新增：

```markdown
- `figma-overlay-check`
```

- [ ] **Step 5: 验证 README**

运行：

```bash
git diff --check
rg -q 'figma-overlay-check' README.md
test -f figma-overlay-check/SKILL.md
```

从 README 提取所有 `(<path>/SKILL.md)` 相对链接并逐项运行 `test -f`。预期全部退出码为 `0`。

- [ ] **Step 6: 提交 README**

运行：

```bash
git add README.md
git commit -m "Document figma overlay check skill"
```

### Task 3: 验证安装并发布到目标 master

**Files:**
- Verify: `README.md`
- Verify: `figma-overlay-check/**`

**Interfaces:**
- Consumes: Tasks 1–2 的迁移提交。
- Produces: 远端 `dengshangli/skills` 的已验证 `master`。

- [ ] **Step 1: 验证整库安装**

创建系统临时目录，将所有 `*/SKILL.md` 对应目录按 README 的整库安装循环复制进去。验证 5 个 Skill 的 `SKILL.md` 均存在，且 `.git`、`docs` 和根 README 未被复制。

- [ ] **Step 2: 验证单 Skill sparse-checkout**

从公开目标仓库执行 sparse-checkout 前，先推送功能分支：

```bash
git push -u origin agent/migrate-figma-overlay-check
```

在系统临时目录运行：

```bash
git clone --filter=blob:none --no-checkout \
  --branch agent/migrate-figma-overlay-check \
  https://github.com/dengshangli/skills.git skills-single
cd skills-single
git sparse-checkout init --cone
git sparse-checkout set figma-overlay-check
git checkout agent/migrate-figma-overlay-check
```

预期：`figma-overlay-check/SKILL.md` 和 4 个脚本存在，其他 Skill 目录不存在。

- [ ] **Step 3: 最终分支验证**

运行：

```bash
git diff origin/master...HEAD --check
git status -sb
git merge-base --is-ancestor figma-overlay-source/main HEAD
```

预期：格式检查无输出、工作区干净、源 tip 是当前分支祖先。

- [ ] **Step 4: 集成到 master**

推送功能分支并创建以 `master` 为目标的 PR。完成检查后合并；如果用户明确要求直接推送 `master`，则先确认 `origin/master` 是 `HEAD` 的祖先，再运行：

```bash
git push origin HEAD:master
```

- [ ] **Step 5: 从远端 master 重新验证**

运行：

```bash
git fetch origin master
git merge-base --is-ancestor figma-overlay-source/main origin/master
git ls-tree -r --name-only origin/master figma-overlay-check
```

从 `origin/master:figma-overlay-check` 导出目录，与 `figma-overlay-source/main` 导出的目录运行 `diff -ru`。预期历史祖先检查通过、8 个文件均存在、目录比较无差异。

### Task 4: 删除并核验源仓库

**Files:**
- Delete external repository: `dengshangli/figma-overlay-check`

**Interfaces:**
- Consumes: Task 3 已验证的远端目标 `master`。
- Produces: 已删除的源仓库和仍可公开访问的目标迁移目录。

- [ ] **Step 1: 删除前最终闸门**

重新运行并确认：

```bash
gh repo view dengshangli/skills \
  --json nameWithOwner,visibility,defaultBranchRef,url
gh api 'repos/dengshangli/skills/contents/figma-overlay-check/SKILL.md?ref=master' \
  --jq '.path'
git merge-base --is-ancestor figma-overlay-source/main origin/master
```

同时精确核对待删除仓库：

```bash
gh repo view dengshangli/figma-overlay-check \
  --json nameWithOwner,visibility,defaultBranchRef,url
```

只有目标为公开 `dengshangli/skills`、默认分支为 `master`、迁移文件和源历史均已存在，且待删除名称精确为 `dengshangli/figma-overlay-check` 时继续。

- [ ] **Step 2: 删除源仓库**

先检查 GitHub CLI 身份和删除权限：

```bash
gh auth status
gh auth refresh -h github.com -s delete_repo
```

若 `delete_repo` 权限不可用或需要用户交互，停止并请用户完成授权。授权成功后运行：

```bash
gh repo delete dengshangli/figma-overlay-check --yes
```

- [ ] **Step 3: 验证删除和目标可用性**

运行：

```bash
if gh repo view dengshangli/figma-overlay-check; then
  exit 1
fi

gh repo view dengshangli/skills \
  --json nameWithOwner,visibility,url
gh api 'repos/dengshangli/skills/contents/figma-overlay-check/SKILL.md?ref=master' \
  --jq '.path'
```

预期：源仓库返回不存在；目标仓库仍为 `PUBLIC`，并返回 `figma-overlay-check/SKILL.md`。

- [ ] **Step 4: 清理本地临时 remote**

运行：

```bash
git remote remove figma-overlay-source
```

此操作只清理本地配置，不删除目标仓库中已经保留的提交历史。
