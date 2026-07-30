# 双语 Skill 文档信息架构设计

## 目标

将 `dengshangli/skills` 重组为“根目录简洁导航、Skill 目录详细说明”的双语文档结构，方便中文和英文用户理解、安装和使用每个 Skill，同时保持 Agent 执行规则不变。

## 修改范围

本次只修改或新增 README 文档：

- 根目录 `README.md`
- 根目录 `README.zh-CN.md`
- 五个 Skill 目录中的 `README.md`
- 五个 Skill 目录中的 `README.zh-CN.md`

不修改任何 `SKILL.md`、脚本、资源、许可证或 Skill 行为。

## 语言约定

- `README.md` 使用英文。
- `README.zh-CN.md` 使用简体中文。
- 每份 README 顶部提供另一语言版本的相对链接。
- 英中版本保持相同的章节结构、事实、命令和限制，但允许使用符合各自语言习惯的表达，不要求逐字翻译。

## 根目录文档

根 README 只承担仓库导航职责，包含：

1. 仓库名称和一句话定位。
2. Agent Skills 结构与兼容性原则的简短说明。
3. 五个 Skill 的表格：
   - Skill 名称。
   - 一句话用途。
   - 当前主要依赖。
   - 指向该 Skill 详细 README 的相对链接。
4. 通用安装入口：
   - 交互式选择 Skill。
   - 安装单个 Skill。
   - 安装全部 Skill。
5. 简短的兼容性提示。
6. 许可证状态说明。

根 README 不再重复每个 Skill 的详细适用场景、长篇依赖说明、更新、卸载和安全规则。

## Skill 目录文档

每个 Skill 的英文和中文 README 使用以下统一结构：

1. 标题和语言切换链接。
2. 简介。
3. 主要用途或功能。
4. 适用场景。
5. 环境与平台依赖。
6. 安装：
   - 使用 `skills` CLI 安装当前 Skill。
   - 必要时说明手动安装原则。
7. 使用示例。
8. 重要限制和安全提示。
9. 指向 `SKILL.md` 的完整规则链接。
10. 许可证状态。

## 五个 Skill 的文档重点

### `figma-overlay-check`

- 保留现有英文和中文详细功能说明。
- 将旧安装命令 `npx skills add dengshangli/figma-overlay-check` 更新为：

  ```bash
  npx skills add dengshangli/skills --skill figma-overlay-check
  ```

- 将旧 skills.sh badge/link 更新为新仓库下的 Skill 路径；若新索引尚未生成，则暂不展示可能失效的 badge，只保留可验证的安装命令。
- 保留 MIT 许可证说明，因为该目录包含独立 `LICENSE`。

### `wukong-email-template-generator`

- 说明固定悟空邮件外壳、正文生成器和只替换正文的边界。
- 明确依赖 Python 3。
- 披露当前 `SKILL.md` 含作者本机绝对路径，其他用户需要按实际安装目录调整。
- 不修改生成器或 `SKILL.md`。

### `email-template-compatibility-test`

- 说明批量发送本地 HTML 到测试邮箱的用途。
- 区分“服务器接受”与“实际送达/渲染兼容”。
- 明确当前依赖 Codex 应用内置浏览器。
- 强调发送前需要明确确认。

### `jingdouyun-email-template-replacement`

- 说明只替换现有模板的“模板内容”字段。
- 明确依赖 `chrome:control-chrome` 和已登录的 Chrome。
- 强调不创建模板、不修改其他字段。

### `crm-email-manual-send`

- 说明通过本地文件名精确映射 CRM 模板并逐封核验。
- 明确依赖 `chrome:control-chrome` 和已登录的目标 CRM。
- 强调只有明确授权时才能发送，并以跟进记录核验成功。

## 安装命令

每个 Skill 的详细 README 使用统一形式：

```bash
npx skills add dengshangli/skills --skill <skill-name>
```

用户级安装可补充：

```bash
npx skills add dengshangli/skills --skill <skill-name> --global
```

根 README 使用：

```bash
npx skills add dengshangli/skills
npx skills add dengshangli/skills --skill <skill-name>
npx skills add dengshangli/skills --all
```

README 需说明当前 `skills` CLI 要求 Node.js `>=22.20.0`。

## 许可证

- `figma-overlay-check` 的 README 链接其目录内 MIT `LICENSE`。
- 其他 Skill 和仓库根目录目前没有统一许可证，不得声称已采用 MIT 或其他开源许可证。
- 对未授权部分说明：公开访问不等于自动授予复制、修改或再分发许可。

## 验证

1. 所有 12 份 README 文件存在：根目录 2 份，5 个 Skill 各 2 份。
2. 每份 README 的语言切换链接有效。
3. 根 README 中的 Skill 链接指向对应语言的详细 README。
4. 所有安装命令使用 `dengshangli/skills` 和准确的 `--skill` 名称。
5. 不再出现已删除的安装源 `dengshangli/figma-overlay-check`。
6. 英中版本的章节、命令、依赖和限制保持一致。
7. `git diff --check` 无格式错误。
8. 修改范围不包含任何 `SKILL.md`、脚本、资源或许可证。

## 后续工作

双语文档重组完成并发布后，另行处理 skills.sh 索引触发、搜索关键词验证和平台发现入口。本次不把索引成功作为文档重组的验收条件。
