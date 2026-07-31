# Figma Overlay Check 迁移设计

## 目标

将公开仓库 `dengshangli/figma-overlay-check` 完整迁入公开仓库 `dengshangli/dsl-skills` 的 `figma-overlay-check/` 目录，保留源仓库的 3 个 Git 提交历史。确认目标仓库迁移结果完整后，彻底删除源仓库。

## 迁移范围

迁移源仓库 `main` 分支中的全部受版本控制文件：

- `LICENSE`
- `README.md`
- `README.zh-CN.md`
- `SKILL.md`
- `scripts/amplify.mjs`
- `scripts/color-sample.mjs`
- `scripts/crop.mjs`
- `scripts/pixel-diff.mjs`

这些文件在目标仓库中统一放到 `figma-overlay-check/` 下，不修改其内容。

## 历史保留方式

- 将源仓库作为临时 Git remote 添加到目标仓库。
- 获取源仓库 `main` 分支。
- 使用保留父提交关系的 subtree merge，将源仓库完整历史合并到目标分支，并把工作树放入 `figma-overlay-check/`。
- 不使用 `--squash`，确保源仓库的 3 个提交仍可在目标仓库中追溯。
- 迁移完成后移除本地临时 remote；该操作不影响已经合并的历史。

## 根 README 更新

更新目标仓库根目录 `README.md`：

- 在 Skill 总览表中加入 `figma-overlay-check`。
- 增加中文用途、适用场景、关键依赖和调用示例。
- 在单个 Skill 安装目录清单中加入 `figma-overlay-check`。
- 说明该 Skill 用于将实现页面截图与 Figma 设计稿叠加或做像素差异分析，以定位尺寸、位置和颜色偏差。

## 验证

删除源仓库前必须完成以下检查：

1. `figma-overlay-check/SKILL.md` 和 4 个脚本均存在。
2. 迁入文件与源仓库 `main` 分支逐文件一致。
3. 目标仓库历史包含源仓库的 3 个提交对象。
4. 根 README 的相对链接有效，整库安装和 sparse-checkout 单 Skill 安装仍可用。
5. `git diff --check` 无格式错误。
6. 迁移提交已出现在远端 `dengshangli/dsl-skills` 的 `master`。
7. 从远端 `master` 重新读取的 `figma-overlay-check/` 文件与源仓库一致。

## 删除源仓库

- 只有全部迁移验证通过后，才调用 GitHub 删除操作。
- 删除目标必须精确为 `dengshangli/figma-overlay-check`。
- 删除前再次读取源、目标仓库信息并核对名称。
- 删除后验证源仓库返回不存在，同时确认目标仓库仍公开可访问。
- GitHub 仓库删除不可通过本工作流恢复；目标仓库保留的文件和 Git 历史将成为唯一迁移副本。

## 验收标准

- `dengshangli/dsl-skills` 的 `master` 包含 `figma-overlay-check/` 全部文件。
- 目标仓库可以追溯源仓库原有的 3 个提交。
- 根 README 使用中文介绍第五个 Skill 及安装方式。
- `dengshangli/figma-overlay-check` 已被彻底删除。
