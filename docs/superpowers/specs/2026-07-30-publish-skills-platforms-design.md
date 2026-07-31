# Agent Skills 多平台发布设计

## 目标

让 `dengshangli/dsl-skills` 中的五个 Skill 可以通过通用 Agent Skills 搜索入口和主流原生 Marketplace 被发现、查看并安装，同时准确区分“已上线”“审核中”和“需要用户授权”。

目标 Skill：

- `figma-overlay-check`
- `wukong-email-template-generator`
- `email-template-compatibility-test`
- `jingdouyun-email-template-replacement`
- `crm-email-manual-send`

## 发布渠道

### 通用渠道

- skills.sh 搜索与详情页。
- `npx skills find` 搜索。
- `npx skills add dengshangli/dsl-skills --skill <skill-name>` 安装。
- GitHub 仓库名称、描述、Topics 和 README 搜索。

### 原生渠道

- Claude Code Community Marketplace。
- Cursor Marketplace。
- ClawHub / OpenClaw Skills。

Codex、OpenCode 和其他由 `skills` CLI 支持、但没有独立公共 Skill 市场的宿主，通过通用渠道发现和安装。

## 许可证

- 在仓库根目录新增 MIT `LICENSE`，适用于仓库中所有 Skill、脚本、资源和文档。
- `figma-overlay-check/LICENSE` 与根许可证保持 MIT，不删除其目录级副本。
- 五个 `SKILL.md` 的 YAML frontmatter 增加：

  ```yaml
  license: MIT
  ```

- 英文和中文 README 的许可证说明改为 MIT，并链接到根或目录内许可证。
- 不修改 Skill 的执行步骤或授权边界。

## Agent Skills 规范验证

按照 Agent Skills 规范检查：

- 目录名与 frontmatter `name` 完全一致。
- 名称满足小写字母、数字和单连字符规则，长度不超过 64。
- `description` 非空且不超过 1024 个字符。
- `license` 值为 `MIT`。
- `SKILL.md` 文件存在。
- 脚本和资源路径有效。

优先使用 `skills-ref` 或官方等价验证工具；若工具不可用，使用可审计脚本实现同一组规则并报告限制。

## GitHub 元数据

仓库保持公开，并设置：

- Description：简洁说明这是包含视觉 QA 和邮件工作流的跨 Agent Skills 集合。
- Homepage：`https://skills.sh/dengshangli/dsl-skills`，仅在新索引页面确认存在后设置；索引前不设置失效链接。
- Topics：
  - `agent-skills`
  - `ai-agents`
  - `skills`
  - `claude-code`
  - `cursor`
  - `codex`
  - `opencode`
  - `openclaw`
  - `figma`
  - `email-automation`

## skills.sh 发布

### 触发

- 使用满足 Node.js `>=22.20.0` 的运行时执行最新版 `skills` CLI。
- 在系统临时目录中，通过公开仓库实际安装全部五个 Skill 到 `universal` 或其他隔离的测试 Agent 目录。
- 不修改用户现有 Agent Skills 目录。
- 保持 CLI 默认遥测开启，使真实安装事件可以触发 skills.sh 建档和安装计数。

### 验证

- 轮询 skills.sh 搜索 API，按 GitHub owner `dengshangli` 和每个 Skill 的关键词查询。
- 每个新条目必须：
  - `source` 为 `dengshangli/dsl-skills`。
  - `skillId` 与 Skill 名称一致。
  - 详情页可访问。
- 运行 `npx skills find <query> --owner dengshangli` 或其非交互 API 等价检查。
- 旧条目 `dengshangli/figma-overlay-check` 指向已删除仓库。若无法自动消失，向 `vercel-labs/skills` 提交包含证据的清理 Issue；不得伪造或直接调用内部遥测接口。

## Claude Code 发布

### 仓库结构

- 根目录新增 `.claude-plugin/marketplace.json`。
- 每个 Skill 目录新增 `.claude-plugin/plugin.json`。
- 每个 Skill 目录本身作为单 Skill 插件根目录，现有根 `SKILL.md` 由 Claude Code 自动识别。

### Marketplace

根清单列出五个独立插件，使用相对 `source` 指向对应 Skill 目录。每个插件包含：

- 唯一 kebab-case `name`。
- 英文 `description`。
- `version: 1.0.0`。
- 作者 `dengshangli`。
- Homepage 和 repository URL。
- `license: MIT`。
- 用于发现的 `keywords`、`tags` 和 `category`。

### 验证与提交

- 使用 `claude plugin validate` 验证每个插件和 Marketplace 清单。
- 验证用户可以添加自托管 Marketplace 并分别安装五个插件。
- 通过 Anthropic Console 提交五个插件到 `claude-plugins-community` 审核。
- 若提交表单要求浏览器登录、组织选择或人工确认，暂停并交给用户完成；恢复后继续记录提交结果。
- 只有在 Community catalog 中出现条目后标记为“已上线”，此前标记为“审核中”。

## Cursor 发布

### 仓库结构

- 根目录新增 `.cursor-plugin/marketplace.json`。
- 每个 Skill 目录新增 `.cursor-plugin/plugin.json`。
- 每个 Skill 目录使用根 `SKILL.md` 作为单 Skill 插件组件。

### 清单

每个插件包含：

- 唯一 kebab-case `name`。
- 英文 `description`。
- `version: 1.0.0`。
- 作者、homepage、repository、MIT license。
- 发现关键词、分类和 tags。
- 显式或自动发现的根 `SKILL.md`。

### 验证与提交

- 根据 Cursor 官方 schema 验证根 Marketplace 和五个插件清单。
- 在隔离的本地 Cursor 插件目录或官方验证流程中确认组件可被发现。
- 通过 `cursor.com/marketplace/publish` 提交人工审核。
- 登录或提交确认需要用户交互时暂停并交接。
- 只有在 Cursor Marketplace 可搜索时标记“已上线”。

## ClawHub 发布

- 安装官方 `clawhub` CLI。
- 登录并核对发布者 handle；不得猜测 owner。
- 对五个 Skill 逐个运行发布前验证。
- 首次版本统一为 `1.0.0`。
- Slug 使用 Skill 名称。
- Display name 使用易读名称。
- Changelog 说明首次从 `dengshangli/dsl-skills` 发布。
- 先执行 dry-run 或等价验证，再实际发布。
- 发布后等待自动安全扫描。
- 只有详情页和搜索结果可用时标记“已上线”；扫描等待期间标记“审核中”。

## README 更新

发布后更新根双语 README 和各 Skill 双语 README：

- 增加实际已验证的平台安装命令。
- 增加 skills.sh、Claude、Cursor、ClawHub 的详情页或 Marketplace 链接。
- 对审核中的平台明确标注“Pending review”，不使用失效链接。
- 不在仓库中保存访问令牌、设备码、Cookie 或登录信息。

## 安全与授权

- 用户已明确授权公开发布全部五个 Skill，并同意采用 MIT License。
- 两个 CRM Skill 中已有公开测试环境域名；发布会增加可发现性，但本次不修改域名或工作流。
- 外部平台登录、OAuth 授权、组织选择、提交审核和可能的条款确认由用户完成。
- 不绕过 CAPTCHA、审核或 Marketplace 安全扫描。
- 不向任何平台发布浏览器会话数据或本地绝对凭证。

## 状态模型

每个渠道和 Skill 的状态只能是：

- `not_started`
- `prepared`
- `submitted`
- `pending_review`
- `live`
- `blocked`

最终报告逐平台、逐 Skill列出状态、公开链接、验证证据和阻塞原因。

## 验收标准

1. 仓库采用 MIT License，五个 `SKILL.md` 均声明 `license: MIT`。
2. 五个 Skill 通过 Agent Skills 规范验证。
3. GitHub Description 和 Topics 完成，仓库仍公开。
4. skills.sh 使用新源 `dengshangli/dsl-skills` 索引五个 Skill。
5. Claude Code 和 Cursor 的五插件清单通过本地验证并已提交审核，或准确记录用户交互阻塞。
6. 五个 Skill 已提交 ClawHub，并准确区分扫描中和已上线。
7. README 只展示已验证链接和准确状态。
8. 未提交任何令牌、Cookie、设备码或其他敏感信息。
