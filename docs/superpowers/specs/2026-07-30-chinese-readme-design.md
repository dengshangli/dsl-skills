# 中文 README 设计说明

## 目标

为 `dengshangli/skills` 仓库新增中文 `README.md`，帮助使用者快速判断各 Skill 的用途，并能选择整库安装或单个 Skill 安装。

## 读者

- 希望在 Codex 中安装这些 Skill 的使用者。
- 需要了解邮件模板生成、测试、替换和 CRM 手动发送流程的维护者。

## 文档结构

1. 仓库简介与适用范围。
2. Skill 总览表，列出名称、用途、典型场景和关键依赖。
3. 分别介绍四个 Skill：
   - `wukong-email-template-generator`
   - `email-template-compatibility-test`
   - `jingdouyun-email-template-replacement`
   - `crm-email-manual-send`
4. 安装说明：
   - 克隆仓库后整库安装。
   - 使用 Git sparse-checkout 获取并安装单个 Skill。
5. 更新、卸载和安装验证。
6. 每个 Skill 的中文自然语言调用示例。
7. 浏览器登录、操作授权和内部测试环境等注意事项。

## 安装约定

- Codex Skill 默认安装目录使用 `${CODEX_HOME:-$HOME/.codex}/skills`。
- 整库安装时只复制仓库中的 Skill 目录，不把 `.git`、`docs` 或 README 当作 Skill 安装。
- 单个 Skill 安装使用 `git sparse-checkout`，避免依赖 GitHub 网页下载链接或手工拼接文件。
- 安装命令避免覆盖已有同名目录；README 会提示用户在覆盖前先备份或删除旧版本。

## 内容边界

- README 只概述用途和使用方式，不重复完整的 `SKILL.md` 工作流。
- 所有介绍以仓库当前文件为准，不承诺未实现的能力。
- CRM 与后台管理类 Skill 明确说明需要已登录的浏览器会话。
- 涉及发送邮件或提交修改的操作，强调必须由用户明确授权。

## 验收标准

- README 主要内容全部使用中文。
- 四个现有 Skill 均有用途、适用场景、依赖和调用示例。
- 整库安装与单个 Skill 安装命令可以直接复制，并与仓库目录结构一致。
- 包含更新、卸载、验证和安全注意事项。
- Markdown 格式检查无错误，所有仓库内相对链接均指向现有文件。
