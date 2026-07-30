# 双语 Skill 文档 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立根目录简洁导航、五个 Skill 目录详细说明的英文 `README.md` 与中文 `README.zh-CN.md` 双语文档结构。

**Architecture:** 根 README 只提供仓库定位、Skill 表格、通用安装入口和兼容性提示；每个 Skill 目录的双语 README 承担详细用途、依赖、安装、示例和限制说明。所有内容从现有 `SKILL.md` 提取，不修改 Skill 实现。

**Tech Stack:** Markdown、Git、`skills` CLI 命令格式

## Global Constraints

- `README.md` 使用英文，`README.zh-CN.md` 使用简体中文。
- 根目录和五个 Skill 目录均提供语言切换链接。
- 不修改任何 `SKILL.md`、脚本、资源或许可证。
- 所有安装命令使用 `dengshangli/skills`。
- 单 Skill 安装统一使用 `--skill <skill-name>`。
- README 披露真实平台依赖，不宣称所有 Skill 在所有宿主中均可无条件运行。
- `skills` CLI 的 Node.js 版本要求写为 `>=22.20.0`。

---

### Task 1: 创建简洁的双语根 README

**Files:**
- Rewrite: `README.md`
- Create: `README.zh-CN.md`

**Interfaces:**
- Consumes: 五个 Skill 名称、用途和主要依赖。
- Produces: 英文与中文仓库导航入口。

- [ ] **Step 1: 重写英文根 README**

`README.md` 使用以下结构：

```markdown
# Agent Workflow Skills

[English](./README.md) | [中文](./README.zh-CN.md)

## Skills

| Skill | Purpose | Main requirements |

## Install

## Compatibility

## License
```

要求：

- 简介不超过两段。
- Skill 名称链接到各目录的英文 `README.md`。
- 表格只用一句话介绍用途和主要依赖。
- 安装只保留以下入口：

  ```bash
  npx skills add dengshangli/skills
  npx skills add dengshangli/skills --skill <skill-name>
  npx skills add dengshangli/skills --all
  ```

- 说明 Node.js `>=22.20.0`。
- 兼容性说明指引用户阅读各 Skill 的详细 README。
- 许可证说明不得声称整个仓库采用 MIT。

- [ ] **Step 2: 创建中文根 README**

`README.zh-CN.md` 与英文版章节和事实一一对应：

```markdown
# Agent 工作流 Skills

[English](./README.md) | [中文](./README.zh-CN.md)

## Skills

| Skill | 用途 | 主要依赖 |

## 安装

## 兼容性

## 许可证
```

Skill 名称链接到各目录的中文 `README.zh-CN.md`。

- [ ] **Step 3: 验证根 README**

运行：

```bash
test -f README.md
test -f README.zh-CN.md
for skill in figma-overlay-check wukong-email-template-generator email-template-compatibility-test jingdouyun-email-template-replacement crm-email-manual-send; do
  rg -q "$skill" README.md
  rg -q "$skill" README.zh-CN.md
done
```

预期：退出码为 `0`。

### Task 2: 完成 Figma 与悟空生成器双语详细 README

**Files:**
- Modify: `figma-overlay-check/README.md`
- Modify: `figma-overlay-check/README.zh-CN.md`
- Create: `wukong-email-template-generator/README.md`
- Create: `wukong-email-template-generator/README.zh-CN.md`
- Reference: `figma-overlay-check/SKILL.md`
- Reference: `wukong-email-template-generator/SKILL.md`

**Interfaces:**
- Consumes: 两个 Skill 的现有规则、脚本和许可证状态。
- Produces: 面向用户的双语详细说明。

- [ ] **Step 1: 更新 Figma 英文 README**

保留现有功能说明并统一章节为：

```markdown
# figma-overlay-check

[English](./README.md) | [中文](./README.zh-CN.md)

## Overview
## What it does
## Use cases
## Requirements
## Install
## Usage examples
## Important notes
## Full instructions
## License
```

将安装命令改为：

```bash
npx skills add dengshangli/skills --skill figma-overlay-check
npx skills add dengshangli/skills --skill figma-overlay-check --global
```

删除指向旧仓库 `dengshangli/figma-overlay-check` 的 badge 和链接。

- [ ] **Step 2: 更新 Figma 中文 README**

使用与英文版对应的章节：

```markdown
## 简介
## 功能
## 适用场景
## 环境要求
## 安装
## 使用示例
## 重要说明
## 完整规则
## 许可证
```

事实、命令和限制与英文版一致。

- [ ] **Step 3: 创建悟空生成器英文 README**

内容必须包括：

- 使用固定悟空邮件外壳生成 HTML。
- 仅允许替换正文标记，固定模板不可修改。
- 必须执行 `scripts/generate_email.py`。
- 需要 Python 3。
- 安装命令：

  ```bash
  npx skills add dengshangli/skills --skill wukong-email-template-generator
  ```

- 披露 `SKILL.md` 当前包含作者本机绝对路径，其他用户需要按实际安装位置调整。
- 示例请求至少两个。
- 当前无独立许可证。

- [ ] **Step 4: 创建悟空生成器中文 README**

与英文版保持相同章节、事实、命令、路径限制和许可证状态。

- [ ] **Step 5: 验证两个 Skill 文档**

运行：

```bash
for skill in figma-overlay-check wukong-email-template-generator; do
  test -f "$skill/README.md"
  test -f "$skill/README.zh-CN.md"
  rg -q "dengshangli/skills --skill $skill" "$skill/README.md"
  rg -q "dengshangli/skills --skill $skill" "$skill/README.zh-CN.md"
done
```

预期：退出码为 `0`。

### Task 3: 完成兼容性测试与 CRM 类双语详细 README

**Files:**
- Create: `email-template-compatibility-test/README.md`
- Create: `email-template-compatibility-test/README.zh-CN.md`
- Create: `jingdouyun-email-template-replacement/README.md`
- Create: `jingdouyun-email-template-replacement/README.zh-CN.md`
- Create: `crm-email-manual-send/README.md`
- Create: `crm-email-manual-send/README.zh-CN.md`
- Reference: corresponding `SKILL.md` files

**Interfaces:**
- Consumes: 三个 Skill 的浏览器依赖、授权边界和结果核验规则。
- Produces: 面向用户的双语详细说明。

- [ ] **Step 1: 创建兼容性测试英文 README**

必须说明：

- 批量把本地 HTML 发送到多个测试邮箱。
- 文件名默认作为邮件标题。
- “服务器接受”不等于“送达或渲染兼容”。
- 当前要求 Codex in-app browser。
- 发送前需要批次确认。
- 安装命令使用 `--skill email-template-compatibility-test`。
- 当前无独立许可证。

- [ ] **Step 2: 创建兼容性测试中文 README**

与英文版保持相同章节、事实、安装命令、安全边界和许可证状态。

- [ ] **Step 3: 创建筋斗云替换英文 README**

必须说明：

- 本地 HTML 文件名映射现有模板名称。
- 只替换“模板内容”字段。
- 不创建模板、不修改名称、主题、分类、状态或其他字段。
- 当前要求 `chrome:control-chrome` 和已登录 Chrome。
- 安装命令使用 `--skill jingdouyun-email-template-replacement`。
- 当前无独立许可证。

- [ ] **Step 4: 创建筋斗云替换中文 README**

与英文版保持相同章节、事实、安装命令、安全边界和许可证状态。

- [ ] **Step 5: 创建 CRM 手动发送英文 README**

必须说明：

- 本地 HTML 文件名精确映射 CRM 模板。
- 逐封发送并通过新的跟进记录核验。
- 维护去重台账，避免重复发送。
- 当前要求 `chrome:control-chrome`、已登录目标 CRM 和明确目标线索页。
- 只有明确授权时才能发送。
- 安装命令使用 `--skill crm-email-manual-send`。
- 当前无独立许可证。

- [ ] **Step 6: 创建 CRM 手动发送中文 README**

与英文版保持相同章节、事实、安装命令、安全边界和许可证状态。

- [ ] **Step 7: 验证三个 Skill 文档**

运行：

```bash
for skill in email-template-compatibility-test jingdouyun-email-template-replacement crm-email-manual-send; do
  test -f "$skill/README.md"
  test -f "$skill/README.zh-CN.md"
  rg -q "dengshangli/skills --skill $skill" "$skill/README.md"
  rg -q "dengshangli/skills --skill $skill" "$skill/README.zh-CN.md"
done
```

预期：退出码为 `0`。

### Task 4: 全量验证文档结构与修改范围

**Files:**
- Verify: root and per-Skill README files
- Verify unchanged: `*/SKILL.md`, scripts, assets, licenses

**Interfaces:**
- Consumes: Tasks 1–3 的 12 份 README。
- Produces: 可发布的双语文档提交。

- [ ] **Step 1: 验证 12 份 README**

运行：

```bash
test -f README.md
test -f README.zh-CN.md
for skill in figma-overlay-check wukong-email-template-generator email-template-compatibility-test jingdouyun-email-template-replacement crm-email-manual-send; do
  test -f "$skill/README.md"
  test -f "$skill/README.zh-CN.md"
done
```

- [ ] **Step 2: 验证语言切换和相对链接**

检查每份 README 都同时包含 `README.md` 与 `README.zh-CN.md` 的相对链接。从 Markdown 中提取全部本地 `.md` 和 `LICENSE` 链接，并逐项运行 `test -e`。

- [ ] **Step 3: 验证安装源和名称**

运行：

```bash
if rg -n 'dengshangli/figma-overlay-check' --glob 'README*.md'; then
  exit 1
fi

for skill in figma-overlay-check wukong-email-template-generator email-template-compatibility-test jingdouyun-email-template-replacement crm-email-manual-send; do
  rg -q "dengshangli/skills --skill $skill" "$skill/README.md"
  rg -q "dengshangli/skills --skill $skill" "$skill/README.zh-CN.md"
done
```

- [ ] **Step 4: 验证修改范围**

运行：

```bash
git diff --name-only master...HEAD
```

除 `docs/superpowers` 规格和计划外，只允许 `README.md`、`README.zh-CN.md` 与 `<skill>/README*.md`。不得出现 `SKILL.md`、脚本、资源或许可证修改。

- [ ] **Step 5: 检查格式和双语关键事实**

运行：

```bash
git diff --check
```

对每个 Skill 的英文和中文 README 检查：

- Skill 名称一致。
- 安装命令一致。
- 依赖一致。
- 安全限制一致。
- 许可证状态一致。

- [ ] **Step 6: 提交并发布**

运行：

```bash
git add README.md README.zh-CN.md */README.md */README.zh-CN.md
git commit -m "Add bilingual Skill documentation"
```

完成最终验证后推送功能分支，并按用户选择集成到 `master`。
