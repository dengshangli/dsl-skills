# Agent 工作流 Skills

[English](./README.md) | 中文

一组可复用的 Agent Skills，覆盖视觉还原度检查和邮件工作流。仓库采用以 `SKILL.md` 为核心的 Agent Skills 结构，可供兼容的智能编码工具与自动化 Agent 使用。

每个 Skill 都在自己的目录中维护详细说明、环境要求、调用示例和安全提示。

## Skills

| Skill | 用途 | 主要依赖 |
|---|---|---|
| [`figma-overlay-check`](./figma-overlay-check/README.zh-CN.md) | 通过运行时叠图、尺寸测量、颜色检查和像素差异对比网页与 Figma 设计稿 | Figma MCP、Playwright MCP、Node.js |
| [`figma-overlay-cleanup`](./figma-overlay-cleanup/README.zh-CN.md) | 安全删除已保留的 Figma 叠图及其记录产物，同时保留 UI 修改 | 有效的叠图状态清单，可用时使用浏览器自动化 |
| [`wukong-email-template-generator`](./wukong-email-template-generator/README.zh-CN.md) | 在固定悟空邮件外壳中生成 HTML 邮件 | Python 3、仓库自带生成器 |
| [`email-template-compatibility-test`](./email-template-compatibility-test/README.zh-CN.md) | 将本地 HTML 模板批量发送到测试邮箱并记录服务器接受结果 | Codex 应用内置浏览器 |
| [`jingdouyun-email-template-replacement`](./jingdouyun-email-template-replacement/README.zh-CN.md) | 只替换筋斗云同名邮件模板的内容字段 | 已登录 Chrome、`chrome:control-chrome` |
| [`crm-email-manual-send`](./crm-email-manual-send/README.zh-CN.md) | 将本地文件名映射到 CRM 模板，逐封发送并核验跟进记录 | 已登录 CRM 的 Chrome、`chrome:control-chrome` |

## 安装

当前 `skills` CLI 要求 Node.js `>=22.20.0`。以下命令只安装到用户级共享根目录 `~/.agents/skills/`，兼容的 AI 工具共用同一份 Skill。

```bash
# 交互式选择 Skill
npx skills add dengshangli/dsl-skills --global --agent universal

# 安装单个 Skill
npx skills add dengshangli/dsl-skills --global --agent universal --skill <skill-name>

# 将全部 Skill 安装到共享根目录
npx skills add dengshangli/dsl-skills --global --agent universal --skill '*' --yes
```

各 Skill 的具体要求和调用示例，请点击上表中的 Skill 名称查看。

## 兼容性

仓库格式是通用的，但实际运行取决于宿主 Agent 是否提供特定 Skill 所需的浏览器控制、MCP、本地命令和已登录会话。安装或执行前请阅读对应 Skill 的环境要求。

## 许可证

本仓库采用 [MIT License](./LICENSE)。
